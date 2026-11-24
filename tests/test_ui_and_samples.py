from pathlib import Path
from pypdf import PdfReader

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_cvs"


def test_six_sample_pdfs_exist_and_extract_clean_text():
    pdfs = sorted(SAMPLE_DIR.glob("*.pdf"))
    assert len(pdfs) == 6
    for pdf in pdfs:
        reader = PdfReader(pdf)
        text = "\n".join((p.extract_text() or "") for p in reader.pages).strip()
        assert len(text) >= 400, f"Sample PDF terlalu pendek: {pdf.name}"


def test_ui_components_clamp_gauges_and_escape_xss():
    from screener_engine import CandidateEvaluation, ScreenedCandidate
    from ui_components import (
        get_saas_css,
        render_donut_gauge,
        render_match_pill,
        render_recommendation_card,
        render_top_hire_banner,
    )

    assert "<style>" in get_saas_css()
    assert "High" in render_match_pill("High")
    assert "Low" in render_match_pill("Low")

    gauge_over = render_donut_gauge("Job Match", 130)
    gauge_under = render_donut_gauge("Experience", -10)
    assert "100%" in gauge_over and "130%" not in gauge_over
    assert "0%" in gauge_under and "-10%" not in gauge_under

    xss_candidate = ScreenedCandidate(
        filename="xss.pdf",
        evaluation=CandidateEvaluation(
            candidate_name="<script>alert(1)</script> Nadia",
            location="Jakarta & <Bandung>",
            overall_score=88,
            job_match_score=90,
            experience_score=84,
            technical_skills_score=89,
            recommended=True,
            one_line_summary="Cocok & <b>kuat</b> di RAG.",
            key_strengths=["Python & RAG", "Streamlit"],
            key_gaps=["Kubernetes"],
            interview_focus_areas=[
                "Gali arsitektur RAG di proyek produksi",
                "Evaluasi kolaborasi lintas tim produk",
                "Uji praktik deployment & monitoring",
            ],
        ),
        rag_similarity=0.81,
        match_level="High",
        model_used="gemini-3.5-flash-lite",
    )

    card_html = render_recommendation_card(xss_candidate)
    assert "<script>" not in card_html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in card_html
    assert "Job Match" in card_html
    assert "Experience" in card_html
    assert "Technical Skills" in card_html
    assert "Interview Focus Areas" in card_html
    assert "Gali arsitektur RAG" in card_html

    banner_html = render_top_hire_banner(xss_candidate, total_candidates=6, elapsed_seconds=4.2)
    assert "<script>" not in banner_html
    assert "88" in banner_html


def test_app_py_and_launcher_meet_constraints():
    import ast

    base = SAMPLE_DIR.parent
    app_path = base / "app.py"
    bat_path = base / "run_app.bat"
    cfg_path = base / ".streamlit" / "config.toml"

    assert app_path.exists(), "app.py belum dibuat"
    assert bat_path.exists(), "run_app.bat belum dibuat"
    assert cfg_path.exists(), ".streamlit/config.toml belum dibuat"

    source = app_path.read_text(encoding="utf-8")
    ast.parse(source, filename="app.py")

    assert 'type="password"' in source
    assert "st.secrets" in source
    for forbidden in ("hydrogen", "google.generativeai", "gemini-2.5", "gemini-2.0", "gemini-1.5"):
        assert forbidden not in source.lower(), f"String terlarang ditemukan di app.py: {forbidden}"


def test_all_bulk_deliverables_use_flash_lite_and_exist():
    base = SAMPLE_DIR.parent
    for fname in (
        "screener_engine.py",
        "ui_components.py",
        "app.py",
        "architecture_diagram.html",
        "README_Materi.md",
        "requirements.txt",
        "run_app.bat",
    ):
        path = base / fname
        assert path.exists(), f"Deliverable hilang: {fname}"
        content = path.read_text(encoding="utf-8").lower()
        assert "hydrogen" not in content, f"Masih ada 'hydrogen' di {fname}"
    assert (base / "architecture_diagram.png").exists()


def test_streamlit_app_runs_end_to_end_without_exceptions():
    from streamlit.testing.v1 import AppTest
    from screener_engine import BulkScreeningReport, CandidateEvaluation, ScreenedCandidate

    at = AppTest.from_file(str(SAMPLE_DIR.parent / "app.py"), default_timeout=15)
    at.run()
    assert not at.exception, f"Streamlit app raised exception on load: {at.exception}"

    # Inject a completed BulkScreeningReport into session_state and verify full SaaS dashboard renders
    sample_report = BulkScreeningReport(
        role_title="Junior AI Engineer",
        elapsed_seconds=4.5,
        failed_files=[],
        candidates=[
            ScreenedCandidate(
                filename="01_Nadia_Kusuma_AI_Engineer.pdf",
                evaluation=CandidateEvaluation(
                    candidate_name="Nadia Kusuma",
                    location="Jakarta Selatan",
                    overall_score=91,
                    job_match_score=92,
                    experience_score=88,
                    technical_skills_score=93,
                    recommended=True,
                    one_line_summary="Kandidat terbaik dengan pengalaman RAG dan Streamlit.",
                    key_strengths=["RAG produksi", "Pydantic", "Streamlit"],
                    key_gaps=["Docker skala besar"],
                    interview_focus_areas=[
                        "Bedah arsitektur RAG di proyek EdTech",
                        "Evaluasi strategi menekan halusinasi LLM",
                        "Diskusi kolaborasi lintas tim produk",
                    ],
                ),
                rag_similarity=0.84,
                match_level="High",
                model_used="gemini-3.5-flash-lite",
            )
        ],
    )
    at.session_state["report"] = sample_report
    at.session_state["selected_filename"] = "01_Nadia_Kusuma_AI_Engineer.pdf"
    at.run()
    assert not at.exception, f"Streamlit dashboard raised exception: {at.exception}"
    rendered_html = "\n".join(m.value for m in at.markdown)
    assert "Nadia Kusuma" in rendered_html
    assert "Interview Focus Areas" in rendered_html
    assert "Job Match" in rendered_html


def test_html_components_have_no_commonmark_indented_code_blocks_and_app_uses_width_stretch():
    from screener_engine import CandidateEvaluation, ScreenedCandidate
    from ui_components import (
        render_candidates_table_html,
        render_recommendation_card,
        render_top_hire_banner,
    )

    cand = ScreenedCandidate(
        filename="01_Nadia.pdf",
        evaluation=CandidateEvaluation(
            candidate_name="Nadia\nKusuma",
            location="Jakarta",
            overall_score=88,
            job_match_score=90,
            experience_score=85,
            technical_skills_score=89,
            recommended=True,
            one_line_summary="Kuat di RAG\ndan Streamlit.",
            key_strengths=["RAG", "Python"],
            key_gaps=["K8s"],
            interview_focus_areas=["Area 1", "Area 2", "Area 3"],
        ),
        rag_similarity=0.82,
        match_level="High",
        model_used="gemini-3.5-flash-lite",
    )

    for html_out in (
        render_candidates_table_html([cand], selected_filename=cand.filename),
        render_recommendation_card(cand),
        render_top_hire_banner(cand, total_candidates=1, elapsed_seconds=2.5),
    ):
        for line in html_out.splitlines():
            assert not line.startswith("    "), f"Baris HTML berindentasi >=4 spasi memicu CommonMark code block: {line!r}"
            assert line.strip() != "", "Baris kosong di HTML memutus CommonMark HTML block"

    app_src = (SAMPLE_DIR.parent / "app.py").read_text(encoding="utf-8")
    assert "use_container_width=" not in app_src
    assert 'width="stretch"' in app_src
    assert "uploader_key" in app_src
    assert "safe_csv_filename" in app_src


def test_app_uses_right_detail_button_table_and_stacked_recommendation_layout():
    app_src = (SAMPLE_DIR.parent / "app.py").read_text(encoding="utf-8")
    assert "Pilih kandidat untuk melihat" not in app_src
    assert 'selection_mode="single-row"' not in app_src
    assert "Lihat Detail" in app_src
    assert "st.container(height=" in app_src
    assert app_src.index("#### 👥 Candidates") < app_src.index("#### ✨ AI Recommendation")
