import io
from pathlib import Path
from types import SimpleNamespace

import pytest
from pypdf import PdfWriter

from screener_engine import (
    DEFAULT_EMBEDDING_MODEL,
    DEFAULT_REASONING_MODEL,
    FALLBACK_REASONING_MODELS,
    ROLE_PRESETS,
    CandidateEvaluation,
    classify_match_level,
    extract_bulk_pdfs,
    generate_interview_invite,
    results_to_csv_bytes,
    screen_candidates,
)

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_cvs"


def test_classify_match_level_boundaries():
    assert classify_match_level(100) == "High"
    assert classify_match_level(75) == "High"
    assert classify_match_level(74) == "Medium"
    assert classify_match_level(50) == "Medium"
    assert classify_match_level(49) == "Low"
    assert classify_match_level(0) == "Low"


def test_extract_bulk_pdfs_separates_valid_and_corrupt_or_scanned():
    valid_pdf_path = sorted(SAMPLE_DIR.glob("*.pdf"))[0]
    valid_bytes = valid_pdf_path.read_bytes()

    blank_writer = PdfWriter()
    blank_writer.add_blank_page(width=200, height=200)
    blank_buf = io.BytesIO()
    blank_writer.write(blank_buf)

    corrupt_bytes = b"ini bukan file pdf valid"

    docs, failed = extract_bulk_pdfs(
        [
            (valid_pdf_path.name, valid_bytes),
            ("scan_kosong.pdf", blank_buf.getvalue()),
            ("rusak.pdf", corrupt_bytes),
        ]
    )
    assert len(docs) == 1
    assert docs[0].filename == valid_pdf_path.name
    assert len(failed) == 2
    failed_names = {f.filename for f in failed}
    assert failed_names == {"scan_kosong.pdf", "rusak.pdf"}


def test_screen_candidates_ranks_descending_and_supports_empty_must_have():
    pdfs = sorted(SAMPLE_DIR.glob("*.pdf"))[:3]
    payload = [(p.name, p.read_bytes()) for p in pdfs]
    preset = ROLE_PRESETS["Junior AI Engineer (Startup EdTech)"]

    score_map = {
        pdfs[0].name: (91, 92, 88, 93, True),
        pdfs[1].name: (44, 42, 45, 46, False),
        pdfs[2].name: (68, 70, 65, 69, False),
    }

    embed_calls = []
    interaction_calls = []

    class _FakeBulkClient:
        def __init__(self):
            self.models = SimpleNamespace(embed_content=self._embed)
            self.interactions = SimpleNamespace(create=self._interact)

        def _embed(self, model, contents):
            embed_calls.append((model, len(contents)))
            return SimpleNamespace(
                embeddings=[SimpleNamespace(values=[1.0, 0.1 * (i + 1)]) for i in range(len(contents))]
            )

        def _interact(self, **kwargs):
            interaction_calls.append(kwargs)
            prompt = kwargs["input"]
            matched_file = next(name for name in score_map if name in prompt)
            ov, jm, exp, tech, rec = score_map[matched_file]
            ev = CandidateEvaluation(
                candidate_name=matched_file.replace(".pdf", ""),
                location="Jakarta",
                overall_score=ov,
                job_match_score=jm,
                experience_score=exp,
                technical_skills_score=tech,
                recommended=rec,
                one_line_summary=f"Ringkasan untuk {matched_file}",
                key_strengths=["Python kuat", "Proyek terukur"],
                key_gaps=["Perlu pengalaman skala besar"],
                interview_focus_areas=[
                    "Gali arsitektur RAG dan chunking",
                    "Evaluasi pengalaman kolaborasi tim produk",
                    "Uji praktik deployment dan monitoring LLM",
                ],
            )
            return SimpleNamespace(status="completed", output_text=ev.model_dump_json())

    progress_events = []
    report = screen_candidates(
        client=_FakeBulkClient(),
        files=payload,
        role_title=preset["role_title"],
        criteria_text=preset["criteria"],
        must_have_text="",
        max_workers=2,
        progress_callback=lambda done, total, msg: progress_events.append((done, total, msg)),
        sleep_fn=lambda _: None,
    )

    assert len(report.candidates) == 3
    assert [c.evaluation.overall_score for c in report.candidates] == [91, 68, 44]
    assert [c.match_level for c in report.candidates] == ["High", "Medium", "Low"]
    assert embed_calls[0][0] == DEFAULT_EMBEDDING_MODEL
    assert all(count <= 80 for _, count in embed_calls)
    assert all(call["model"] == DEFAULT_REASONING_MODEL for call in interaction_calls)
    assert all(call["timeout"] == 30.0 for call in interaction_calls)
    assert len(progress_events) >= 3


def test_screen_candidates_fallback_on_503_and_isolates_single_candidate_failure():
    pdfs = sorted(SAMPLE_DIR.glob("*.pdf"))[:2]
    payload = [(p.name, p.read_bytes()) for p in pdfs]
    preset = ROLE_PRESETS["Junior AI Engineer (Startup EdTech)"]
    models_seen = []

    class _MixedFailureClient:
        def __init__(self):
            self.models = SimpleNamespace(embed_content=self._embed)
            self.interactions = SimpleNamespace(create=self._interact)

        def _embed(self, model, contents):
            return SimpleNamespace(
                embeddings=[SimpleNamespace(values=[1.0, 0.5]) for _ in range(len(contents))]
            )

        def _interact(self, **kwargs):
            model = kwargs["model"]
            models_seen.append(model)
            if pdfs[1].name in kwargs["input"]:
                return SimpleNamespace(status="completed", output_text="{invalid json")
            if model == DEFAULT_REASONING_MODEL:
                raise RuntimeError("Error code: 503 - service_unavailable high demand")
            ev = CandidateEvaluation(
                candidate_name="Nadia Kusuma",
                location="Jakarta Selatan",
                overall_score=86,
                job_match_score=88,
                experience_score=82,
                technical_skills_score=87,
                recommended=True,
                one_line_summary="Sangat cocok untuk posisi Junior AI Engineer.",
                key_strengths=["RAG produksi", "Streamlit"],
                key_gaps=["Kubernetes"],
                interview_focus_areas=["Arsitektur RAG", "Evaluasi prompt", "Kolaborasi tim"],
            )
            return SimpleNamespace(status="completed", output_text=ev.model_dump_json())

    report = screen_candidates(
        client=_MixedFailureClient(),
        files=payload,
        role_title=preset["role_title"],
        criteria_text=preset["criteria"],
        max_workers=2,
        sleep_fn=lambda _: None,
    )
    assert len(report.candidates) == 1
    assert report.candidates[0].model_used == FALLBACK_REASONING_MODELS[0]
    assert len(report.failed_files) == 1
    assert report.failed_files[0].filename == pdfs[1].name
    assert DEFAULT_REASONING_MODEL in models_seen
    assert FALLBACK_REASONING_MODELS[0] in models_seen


def test_csv_export_and_interview_invite_generation():
    pdfs = sorted(SAMPLE_DIR.glob("*.pdf"))[:1]
    payload = [(pdfs[0].name, pdfs[0].read_bytes())]

    class _SimpleClient:
        def __init__(self):
            self.models = SimpleNamespace(
                embed_content=lambda model, contents: SimpleNamespace(
                    embeddings=[SimpleNamespace(values=[1.0, 0.2]) for _ in range(len(contents))]
                )
            )
            self.interactions = SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    status="completed",
                    output_text=CandidateEvaluation(
                        candidate_name="Nadia Kusuma",
                        location="Jakarta Selatan",
                        overall_score=89,
                        job_match_score=90,
                        experience_score=85,
                        technical_skills_score=91,
                        recommended=True,
                        one_line_summary="Kandidat terkuat dengan pengalaman RAG dan Streamlit.",
                        key_strengths=["RAG", "Pydantic", "Streamlit"],
                        key_gaps=["Docker skala produksi"],
                        interview_focus_areas=[
                            "Bedah arsitektur RAG di proyek EdTech",
                            "Evaluasi strategi menekan halusinasi LLM",
                            "Diskusi kolaborasi lintas tim produk",
                        ],
                    ).model_dump_json(),
                )
            )

    report = screen_candidates(
        client=_SimpleClient(),
        files=payload,
        role_title="Junior AI Engineer",
        criteria_text="Mahir Python, LLM API, RAG, dan Streamlit.",
        sleep_fn=lambda _: None,
    )
    csv_bytes = results_to_csv_bytes(report)
    csv_text = csv_bytes.decode("utf-8-sig")
    assert "Nadia Kusuma" in csv_text
    assert "Jakarta Selatan" in csv_text
    assert "High" in csv_text

    invite = generate_interview_invite(report.candidates[0], "Junior AI Engineer", "Ruangguru")
    assert "Nadia Kusuma" in invite
    assert "Junior AI Engineer" in invite
    assert "Ruangguru" in invite


def test_extract_bulk_pdfs_disambiguates_duplicate_filenames():
    sample_bytes = sorted(SAMPLE_DIR.glob("*.pdf"))[0].read_bytes()
    docs, failed = extract_bulk_pdfs(
        [("CV.pdf", sample_bytes), ("CV.pdf", sample_bytes), ("CV.pdf", sample_bytes)]
    )
    assert len(failed) == 0
    assert [d.filename for d in docs] == ["CV.pdf", "CV (2).pdf", "CV (3).pdf"]


def test_real_timeout_error_triggers_fallback_and_normalizes_blank_llm_fields():
    from screener_engine import friendly_api_error, safe_csv_filename

    assert "sibuk" in friendly_api_error(TimeoutError("timed out")).lower() or "timeout" in friendly_api_error(TimeoutError("timed out")).lower()
    assert safe_csv_filename("Data Scientist / ML Engineer") == "hasil_screening_data_scientist_ml_engineer.csv"

    pdfs = sorted(SAMPLE_DIR.glob("*.pdf"))[:1]
    payload = [(pdfs[0].name, pdfs[0].read_bytes())]
    seen_models: list[str] = []

    class _TimeoutThenBlankFieldsClient:
        def __init__(self):
            self.models = SimpleNamespace(
                embed_content=lambda model, contents: SimpleNamespace(
                    embeddings=[SimpleNamespace(values=[1.0, 0.3]) for _ in range(len(contents))]
                )
            )
            self.interactions = SimpleNamespace(create=self._interact)

        def _interact(self, **kwargs):
            model = kwargs["model"]
            seen_models.append(model)
            if model == DEFAULT_REASONING_MODEL:
                raise TimeoutError("timed out")
            ev = CandidateEvaluation(
                candidate_name="   ",
                location="",
                overall_score=80,
                job_match_score=80,
                experience_score=80,
                technical_skills_score=80,
                recommended=True,
                one_line_summary="=HYPERLINK(\"http://evil\",\"klik\")",
                key_strengths=["Python"],
                key_gaps=["Docker"],
                interview_focus_areas=["Satu topik saja"],
            )
            return SimpleNamespace(status="completed", output_text=ev.model_dump_json())

    report = screen_candidates(
        client=_TimeoutThenBlankFieldsClient(),
        files=payload,
        role_title="Data Scientist / ML Engineer",
        criteria_text="Mahir Python, Pandas, SQL, dan evaluasi model ML.",
        sleep_fn=lambda _: None,
    )
    assert seen_models == [DEFAULT_REASONING_MODEL, FALLBACK_REASONING_MODELS[0]]
    assert len(report.candidates) == 1
    ev = report.candidates[0].evaluation
    assert ev.candidate_name != "" and ev.candidate_name.strip() != ""
    assert ev.location == "Tidak tercantum"
    assert len(ev.interview_focus_areas) == 3

    # CSV formula injection must be neutralized with leading apostrophe
    csv_text = results_to_csv_bytes(report).decode("utf-8-sig")
    assert "'=HYPERLINK" in csv_text


def test_normalize_evaluation_cleans_filename_like_candidate_name():
    from screener_engine import _normalize_evaluation

    raw = CandidateEvaluation(
        candidate_name="05_Bagus_Setiawan_Frontend_Web.pdf",
        location="Tangerang",
        overall_score=35,
        job_match_score=30,
        experience_score=35,
        technical_skills_score=40,
        recommended=False,
        one_line_summary="Fokus frontend web.",
        key_strengths=["React"],
        key_gaps=["Python/AI"],
        interview_focus_areas=["A", "B", "C"],
    )
    cleaned = _normalize_evaluation(raw, "05_Bagus_Setiawan_Frontend_Web.pdf")
    assert ".pdf" not in cleaned.candidate_name.lower()
    assert not cleaned.candidate_name.startswith("05_")
    assert "Bagus Setiawan" in cleaned.candidate_name
