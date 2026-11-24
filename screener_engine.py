"""Engine inti Ready-to-Use Bulk CV Screening Tool (Ruangguru AI Engineer Bootcamp Showcase)."""

from __future__ import annotations

import csv
import io
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Callable, Literal, Sequence

import numpy as np
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError
from pypdf import PdfReader

DEFAULT_REASONING_MODEL = "gemini-3.5-flash-lite"
FALLBACK_REASONING_MODELS: tuple[str, ...] = ("gemini-3.1-flash-lite",)
DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
EMBED_BATCH_SIZE = 80
INTERACTION_TIMEOUT_SECONDS = 30.0

_TRANSIENT_ERROR_TOKENS = (
    "503",
    "service_unavailable",
    "unavailable",
    "high demand",
    "overloaded",
    "429",
    "resource_exhausted",
    "rate limit",
    "timeout",
    "connection",
)

ROLE_PRESETS: dict[str, dict[str, str]] = {
    "Junior AI Engineer (Startup EdTech)": {
        "role_title": "Junior AI Engineer",
        "criteria": (
            "- Mahir menggunakan Python untuk membangun aplikasi dan pipeline AI end-to-end.\n"
            "- Berpengalaman mengintegrasikan LLM API (Gemini, OpenAI, atau Claude) dengan Prompt Engineering & Structured Output.\n"
            "- Memahami arsitektur Retrieval Augmented Generation (RAG), embeddings, dan pencarian semantik berbasis vector.\n"
            "- Pernah membangun AI Agent atau workflow otomasi (LangChain, CrewAI, atau n8n).\n"
            "- Mampu membuat prototipe UI interaktif dengan Streamlit atau Gradio untuk demo ke tim produk.\n"
            "- Terbiasa mengukur dampak proyek dengan metrik evaluasi yang jelas dan memakai Git/GitHub."
        ),
        "must_have": "Python, pengalaman proyek LLM API / RAG atau Machine Learning terukur, Git",
    },
    "Data Scientist / ML Engineer": {
        "role_title": "Data Scientist / ML Engineer",
        "criteria": (
            "- Menguasai Python, Pandas, dan Scikit-learn untuk supervised & unsupervised learning.\n"
            "- Berpengalaman melakukan feature engineering, cross-validation, dan evaluasi model (F1-score, Precision/Recall, ROC-AUC).\n"
            "- Memahami dasar Deep Learning dan PyTorch untuk NLP atau Computer Vision.\n"
            "- Mampu mengolah data dengan SQL/BigQuery dan menyajikan insight bisnis ke stakeholder.\n"
            "- Memiliki portofolio proyek end-to-end di GitHub dengan dokumentasi rapi."
        ),
        "must_have": "Python, SQL, Pandas/Scikit-learn, evaluasi metrik model",
    },
    "AI Automation Specialist (n8n & LLM)": {
        "role_title": "AI Automation Specialist",
        "criteria": (
            "- Berpengalaman merancang workflow automation menggunakan n8n untuk integrasi lintas aplikasi dan REST API.\n"
            "- Mampu menghubungkan layanan AI (Gemini, OpenAI, Claude) ke dalam pipeline otomasi bisnis dengan validasi JSON.\n"
            "- Memahami konsep Prompt Engineering, RAG berbasis knowledge base, webhook trigger, dan error handling.\n"
            "- Memiliki kemampuan Python dasar untuk menulis script kustom saat integrasi API membutuhkan logika tambahan.\n"
            "- Terbiasa mendokumentasikan arsitektur workflow agar mudah dijalankan tim operasional."
        ),
        "must_have": "Workflow automation (n8n/API), Prompt Engineering / LLM API, Python dasar",
    },
}

SYSTEM_INSTRUCTION_HR = (
    "Kamu adalah Lead Technical Recruiter & AI Hiring Manager profesional di perusahaan teknologi Indonesia. "
    "Tugasmu melakukan screening CV kandidat secara objektif, konsisten, dan ketat berdasarkan kriteria role dan syarat wajib (must-have) perusahaan. "
    "Jangan memberi skor tinggi pada kandidat yang bidangnya tidak relevan dengan posisi target. "
    "Seluruh teks ringkasan, kekuatan, celah, dan 3 area fokus interview wajib dalam Bahasa Indonesia yang ringkas, jelas, dan siap dibaca tim HR."
)


class CandidateDocument(BaseModel):
    filename: str
    raw_text: str


class FailedFile(BaseModel):
    filename: str
    reason: str


class CandidateEvaluation(BaseModel):
    """Output JSON terstruktur dari Gemini Agent untuk 1 kandidat."""

    candidate_name: str = Field(description="Nama lengkap kandidat sesuai CV")
    location: str = Field(description="Kota/domisili kandidat (atau 'Tidak tercantum')")
    overall_score: int = Field(ge=0, le=100, description="Skor kecocokan keseluruhan (0-100)")
    job_match_score: int = Field(ge=0, le=100, description="Skor kecocokan terhadap deskripsi role (0-100)")
    experience_score: int = Field(ge=0, le=100, description="Skor relevansi pengalaman kerja/proyek (0-100)")
    technical_skills_score: int = Field(ge=0, le=100, description="Skor kecocokan skill & tools teknis (0-100)")
    recommended: bool = Field(description="True jika layak lanjut tahap interview berdasarkan skor & must-have")
    one_line_summary: str = Field(description="1 kalimat padat alasan rekomendasi atau penolakan")
    key_strengths: list[str] = Field(description="2-3 keunggulan paling menonjol kandidat")
    key_gaps: list[str] = Field(description="2-3 celah utama dibanding kriteria perusahaan")
    interview_focus_areas: list[str] = Field(
        description="Tepat 3 poin konkret area yang perlu digali saat interview"
    )


class ScreenedCandidate(BaseModel):
    filename: str
    evaluation: CandidateEvaluation
    rag_similarity: float = Field(ge=-1.0, le=1.0)
    match_level: Literal["High", "Medium", "Low"]
    model_used: str
    stage: str = "Screening"


class BulkScreeningReport(BaseModel):
    role_title: str
    candidates: list[ScreenedCandidate]
    failed_files: list[FailedFile]
    elapsed_seconds: float


def classify_match_level(score: int) -> Literal["High", "Medium", "Low"]:
    """Klasifikasi deterministik tingkat kecocokan berdasarkan overall_score (0-100)."""
    if score >= 75:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def _cosine_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    a = np.asarray(vec_a, dtype=np.float64)
    b = np.asarray(vec_b, dtype=np.float64)
    na = float(np.linalg.norm(a))
    nb = float(np.linalg.norm(b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def _is_transient_error(exc: Exception) -> bool:
    if isinstance(exc, TimeoutError):
        return True
    err_name = type(exc).__name__.lower()
    if "timeout" in err_name or "connection" in err_name:
        return True
    msg = str(exc).lower()
    return "timed out" in msg or any(tok in msg for tok in _TRANSIENT_ERROR_TOKENS)


def friendly_api_error(exc: Exception) -> str:
    msg = str(exc).lower()
    err_name = type(exc).__name__.lower()
    if any(tok in msg for tok in ("api_key", "api key", "401", "403", "unauthenticated", "permission")):
        return "API Key Gemini tidak valid atau tidak memiliki izin akses."
    if any(tok in msg for tok in ("429", "resource_exhausted", "quota", "rate limit")):
        return "Batas kuota sementara (rate limit 429) tercapai. Tunggu beberapa detik lalu coba lagi."
    if (
        isinstance(exc, TimeoutError)
        or "timeout" in err_name
        or "timed out" in msg
        or any(tok in msg for tok in ("503", "service_unavailable", "unavailable", "high demand", "timeout"))
    ):
        return "Server Gemini sedang sibuk atau timeout sementara."
    return f"Gagal memproses permintaan Gemini API ({type(exc).__name__}): {str(exc)[:180]}"


def create_gemini_client(api_key: str) -> genai.Client:
    clean_key = (api_key or "").strip()
    if not clean_key:
        raise ValueError("GEMINI_API_KEY belum diisi.")
    return genai.Client(
        api_key=clean_key,
        http_options=types.HttpOptions(
            timeout=25_000,
            retry_options=types.HttpRetryOptions(attempts=2),
        ),
    )


def _disambiguate_filename(filename: str, seen_counts: dict[str, int]) -> str:
    count = seen_counts.get(filename, 0) + 1
    seen_counts[filename] = count
    if count == 1:
        return filename
    p = Path(filename)
    return f"{p.stem} ({count}){p.suffix}"


def extract_bulk_pdfs(
    files: Sequence[tuple[str, bytes]],
    min_chars: int = 50,
) -> tuple[list[CandidateDocument], list[FailedFile]]:
    """Ekstrak teks dari banyak file PDF sekaligus; pisahkan file rusak/scan dan buat nama file unik."""
    valid_docs: list[CandidateDocument] = []
    failed: list[FailedFile] = []
    seen_names: dict[str, int] = {}

    for raw_filename, raw_bytes in files:
        filename = _disambiguate_filename(raw_filename, seen_names)
        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
            text = "\n\n".join((p.extract_text() or "").strip() for p in reader.pages).strip()
        except Exception:
            failed.append(
                FailedFile(
                    filename=filename,
                    reason="File PDF tidak valid atau rusak (gagal dibaca).",
                )
            )
            continue

        if len(text) < min_chars:
            failed.append(
                FailedFile(
                    filename=filename,
                    reason="Teks terlalu sedikit / kemungkinan PDF berupa scan gambar tanpa teks.",
                )
            )
            continue

        valid_docs.append(CandidateDocument(filename=filename, raw_text=text))

    return valid_docs, failed


def _embed_in_batches(client: Any, texts: list[str], embedding_model: str) -> list[list[float]]:
    vectors: list[list[float]] = []
    for start in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[start : start + EMBED_BATCH_SIZE]
        resp = client.models.embed_content(model=embedding_model, contents=batch)
        embeddings = getattr(resp, "embeddings", None)
        if not embeddings or len(embeddings) != len(batch):
            raise RuntimeError("Respons embedding dari Gemini API tidak lengkap.")
        for emb in embeddings:
            vals = getattr(emb, "values", None)
            if not vals:
                raise RuntimeError("Vektor embedding kosong dari Gemini API.")
            vectors.append(list(vals))
    return vectors


def _build_candidate_prompt(
    doc: CandidateDocument,
    role_title: str,
    criteria_text: str,
    must_have_text: str,
    rag_similarity: float,
) -> str:
    must_have_section = must_have_text.strip() or "(Tidak ada syarat wajib khusus tambahan)"
    return f"""Evaluasi kandidat berikut untuk posisi **{role_title}** secara objektif dan konsisten dalam Bahasa Indonesia.

Pedoman penilaian ketat:
- Skor 75-100 (High): Sangat relevan, memenuhi mayoritas kriteria & syarat wajib, punya bukti proyek/dampak konkret.
- Skor 50-74 (Medium): Punya sebagian fondasi skill yang bisa ditransfer, tetapi masih ada celah penting pada kriteria inti.
- Skor 0-49 (Low): Bidang/pengalaman tidak relevan dengan posisi target atau tidak memenuhi syarat wajib utama.
- Set `recommended = true` HANYA jika kandidat benar-benar layak dipanggil interview (umumnya skor >= 72 dan memenuhi syarat wajib).
- Isi `interview_focus_areas` dengan TEPAT 3 poin spesifik yang perlu diuji pewawancara berdasarkan CV ini.
- Ambil `candidate_name` dari nama orang asli di dalam isi CV (JANGAN menuliskan nama file `.pdf` atau angka prefix). Jika benar-benar tidak ada nama di CV, baru gunakan nama file tanpa ekstensi.

=== POSISI TARGET ===
{role_title}

=== KRITERIA ROLE ===
{criteria_text}

=== SYARAT WAJIB (MUST-HAVE) ===
{must_have_section}

=== SKOR KEMIRIPAN SEMANTIK AWAL (RAG EMBEDDING) ===
Cosine Similarity CV vs Kriteria Role: {rag_similarity:.0%}

=== FILE CV: {doc.filename} ===
{doc.raw_text[:8000]}
"""


def _clean_candidate_name(raw_name: str, filename: str) -> str:
    """Bersihkan nama kandidat jika kosong atau model mengembalikan nama file .pdf."""
    candidate = (raw_name or "").strip()
    if not candidate or candidate.lower().endswith(".pdf") or "_" in candidate:
        source = candidate or filename
        stem = Path(source).stem if source.lower().endswith(".pdf") else source
        stem = re.sub(r"^\d+[\s_-]+", "", stem)
        stem = re.sub(r"[_]+", " ", stem).strip()
        candidate = " ".join(stem.split())
    return candidate or Path(filename).stem.replace("_", " ")


def _normalize_evaluation(evaluation: CandidateEvaluation, filename: str) -> CandidateEvaluation:
    """Pastikan field wajib tidak pernah kosong dan interview_focus_areas selalu berisi 3 poin."""
    clean_name = _clean_candidate_name(evaluation.candidate_name, filename)
    clean_loc = evaluation.location.strip() or "Tidak tercantum"
    clean_summary = evaluation.one_line_summary.strip() or "Evaluasi berdasarkan kesesuaian CV dengan kriteria role."
    clean_strengths = [s.strip() for s in evaluation.key_strengths if s.strip()] or ["Profil teknis sesuai dasar posisi"]
    clean_gaps = [g.strip() for g in evaluation.key_gaps if g.strip()] or ["Perlu verifikasi mendalam saat wawancara"]

    default_focus = [
        "Gali kedalaman pengalaman proyek nyata dan kontribusi individu kandidat.",
        "Verifikasi penguasaan tools teknis inti terhadap kriteria wajib role.",
        "Evaluasi kemampuan problem solving dan kolaborasi lintas tim produk.",
    ]
    focus = [f.strip() for f in evaluation.interview_focus_areas if f.strip()][:3]
    for fallback_point in default_focus:
        if len(focus) >= 3:
            break
        focus.append(fallback_point)

    return evaluation.model_copy(
        update={
            "candidate_name": clean_name,
            "location": clean_loc,
            "one_line_summary": clean_summary,
            "key_strengths": clean_strengths,
            "key_gaps": clean_gaps,
            "interview_focus_areas": focus,
        }
    )


def _evaluate_single_candidate(
    client: Any,
    doc: CandidateDocument,
    rag_similarity: float,
    role_title: str,
    criteria_text: str,
    must_have_text: str,
    reasoning_model: str,
    fallback_models: Sequence[str],
    sleep_fn: Callable[[float], None],
) -> ScreenedCandidate:
    prompt = _build_candidate_prompt(doc, role_title, criteria_text, must_have_text, rag_similarity)
    candidates_models = [reasoning_model] + [m for m in fallback_models if m != reasoning_model]
    last_exc: Exception | None = None

    for idx, model_name in enumerate(candidates_models):
        try:
            interaction = client.interactions.create(
                model=model_name,
                system_instruction=SYSTEM_INSTRUCTION_HR,
                input=prompt,
                timeout=INTERACTION_TIMEOUT_SECONDS,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": CandidateEvaluation.model_json_schema(),
                },
            )
            status = getattr(interaction, "status", None)
            if status in ("failed", "cancelled", "incomplete"):
                raise RuntimeError(f"Status Gemini {status}: {getattr(interaction, 'error', '')}")
            raw_output = getattr(interaction, "output_text", None) or ""
            evaluation = _normalize_evaluation(
                CandidateEvaluation.model_validate_json(raw_output), doc.filename
            )
            match_level = classify_match_level(evaluation.overall_score)
            return ScreenedCandidate(
                filename=doc.filename,
                evaluation=evaluation,
                rag_similarity=round(rag_similarity, 4),
                match_level=match_level,
                model_used=model_name,
            )
        except ValidationError as exc:
            raise RuntimeError("Output JSON dari model tidak sesuai format yang diharapkan.") from exc
        except Exception as exc:
            last_exc = exc
            if not _is_transient_error(exc) or idx + 1 >= len(candidates_models):
                raise RuntimeError(friendly_api_error(exc)) from exc
            sleep_fn(0.5)

    assert last_exc is not None
    raise RuntimeError(friendly_api_error(last_exc)) from last_exc


def screen_candidates(
    client: Any,
    files: Sequence[tuple[str, bytes]],
    role_title: str,
    criteria_text: str,
    must_have_text: str = "",
    max_workers: int = 4,
    embedding_model: str = DEFAULT_EMBEDDING_MODEL,
    reasoning_model: str = DEFAULT_REASONING_MODEL,
    fallback_models: Sequence[str] = FALLBACK_REASONING_MODELS,
    progress_callback: Callable[[int, int, str], None] | None = None,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> BulkScreeningReport:
    """Jalankan pipeline Bulk CV Screening paralel (Extract -> Batched RAG -> Parallel Agent -> Ranking)."""
    t0 = time.monotonic()
    clean_role = (role_title or "").strip()
    clean_criteria = (criteria_text or "").strip()
    if not clean_role or len(clean_criteria) < 20:
        raise ValueError("Nama posisi dan kriteria role (minimal 20 karakter) wajib diisi.")
    if not files:
        raise ValueError("Unggah minimal 1 file CV PDF atau muat Sample CV terlebih dahulu.")

    valid_docs, failed_files = extract_bulk_pdfs(files)
    total = len(valid_docs)
    if total == 0:
        return BulkScreeningReport(
            role_title=clean_role,
            candidates=[],
            failed_files=failed_files,
            elapsed_seconds=round(time.monotonic() - t0, 2),
        )

    if progress_callback:
        progress_callback(0, total, f"Menghitung RAG semantic matching untuk {total} CV...")

    query_text = f"Role: {clean_role}\nKriteria:\n{clean_criteria}\nSyarat Wajib:\n{must_have_text}"
    embed_inputs = [query_text[:4000]] + [doc.raw_text[:4000] for doc in valid_docs]
    try:
        vectors = _embed_in_batches(client, embed_inputs, embedding_model)
        query_vec = vectors[0]
        rag_scores = [_cosine_similarity(query_vec, vec) for vec in vectors[1:]]
    except Exception as exc:
        raise RuntimeError(friendly_api_error(exc)) from exc

    screened: list[ScreenedCandidate] = []
    completed = 0
    worker_count = max(1, min(max_workers, total))

    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        future_map = {
            executor.submit(
                _evaluate_single_candidate,
                client,
                doc,
                rag_sim,
                clean_role,
                clean_criteria,
                must_have_text,
                reasoning_model,
                fallback_models,
                sleep_fn,
            ): doc
            for doc, rag_sim in zip(valid_docs, rag_scores)
        }

        for future in as_completed(future_map):
            doc = future_map[future]
            completed += 1
            try:
                result = future.result()
                screened.append(result)
                msg = f"Selesai menilai {result.evaluation.candidate_name} ({completed}/{total})"
            except Exception as exc:
                failed_files.append(FailedFile(filename=doc.filename, reason=str(exc)))
                msg = f"Gagal menilai {doc.filename} ({completed}/{total})"
            if progress_callback:
                progress_callback(completed, total, msg)

    screened.sort(
        key=lambda item: (item.evaluation.overall_score, item.rag_similarity),
        reverse=True,
    )
    return BulkScreeningReport(
        role_title=clean_role,
        candidates=screened,
        failed_files=failed_files,
        elapsed_seconds=round(time.monotonic() - t0, 2),
    )


def _safe_csv_cell(value: Any) -> Any:
    """Cegah Excel CSV formula injection pada nilai string tidak tepercaya."""
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + value
    return value


def safe_csv_filename(role_title: str) -> str:
    """Bangun nama file CSV aman lintas OS (tanpa '/' atau karakter ilegal)."""
    slug = re.sub(r"[^a-z0-9]+", "_", (role_title or "").lower()).strip("_") or "kandidat"
    return f"hasil_screening_{slug}.csv"


def results_to_csv_bytes(report: BulkScreeningReport) -> bytes:
    """Ekspor hasil ranking bulk screening menjadi CSV UTF-8-SIG (siap buka di Excel, aman dari formula injection)."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "Peringkat",
            "Nama Kandidat",
            "Tahap",
            "Lokasi",
            "Match",
            "Overall Score",
            "Job Match (%)",
            "Experience (%)",
            "Technical Skills (%)",
            "RAG Similarity (%)",
            "Recommended",
            "Ringkasan AI",
            "File CV",
        ]
    )
    for rank, item in enumerate(report.candidates, start=1):
        ev = item.evaluation
        writer.writerow(
            [
                rank,
                _safe_csv_cell(ev.candidate_name),
                _safe_csv_cell(item.stage),
                _safe_csv_cell(ev.location),
                item.match_level,
                ev.overall_score,
                ev.job_match_score,
                ev.experience_score,
                ev.technical_skills_score,
                f"{item.rag_similarity * 100:.1f}",
                "Ya" if ev.recommended else "Tidak",
                _safe_csv_cell(ev.one_line_summary),
                _safe_csv_cell(item.filename),
            ]
        )
    return buf.getvalue().encode("utf-8-sig")


def generate_interview_invite(
    candidate: ScreenedCandidate,
    role_title: str,
    company_name: str = "Tim Rekrutmen Perusahaan",
) -> str:
    """Buat draft pesan undangan interview Bahasa Indonesia siap salin untuk WhatsApp/Email."""
    ev = candidate.evaluation
    focus_lines = "\n".join(f"{i}. {area}" for i, area in enumerate(ev.interview_focus_areas[:3], start=1))
    return f"""Subjek: Undangan Interview Tahap Awal — Posisi {role_title} ({company_name})

Halo {ev.candidate_name},

Terima kasih telah melamar untuk posisi **{role_title}** di **{company_name}**. Setelah meninjau profil dan pengalaman Anda ({ev.one_line_summary}), kami sangat tertarik untuk mengenal Anda lebih jauh melalui sesi interview online (30–45 menit).

Pada sesi ini, tim hiring kami berencana mendiskusikan beberapa topik utama berikut:
{focus_lines}

Mohon balas pesan ini dengan 2–3 pilihan jadwal yang tersedia bagi Anda dalam 3 hari kerja ke depan agar kami dapat mengirimkan tautan kalender dan meeting.

Salam hangat,
{company_name}
"""
