"""Ready-to-Use Bulk CV Screening Tool — Streamlit SaaS App (Ruangguru AI Engineer Bootcamp Showcase)."""

from __future__ import annotations

import os
from pathlib import Path

import streamlit as st

from screener_engine import (
    DEFAULT_REASONING_MODEL,
    ROLE_PRESETS,
    BulkScreeningReport,
    create_gemini_client,
    generate_interview_invite,
    results_to_csv_bytes,
    safe_csv_filename,
    screen_candidates,
)
from ui_components import (
    _safe_inline,
    get_saas_css,
    render_match_pill,
    render_recommendation_card,
    render_top_hire_banner,
)

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_cvs"

st.set_page_config(
    page_title="AI Bulk CV Screening Tool — Ruangguru AI Engineer Bootcamp",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded",
)
st.markdown(get_saas_css(), unsafe_allow_html=True)


def _resolve_api_key() -> tuple[str, str]:
    """Ambil Gemini API Key secara aman: st.secrets -> env var -> fallback kosong."""
    try:
        secret_key = st.secrets.get("GEMINI_API_KEY", "")
        if secret_key and str(secret_key).strip() not in ("", "TEMPEL_GEMINI_API_KEY_ANDA_DI_SINI"):
            return str(secret_key).strip(), "secrets"
    except Exception:
        pass

    env_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if env_key:
        return env_key, "env"
    return "", "none"


def _load_sample_pdf_files() -> list[tuple[str, bytes]]:
    if not SAMPLE_DIR.exists():
        return []
    return [(p.name, p.read_bytes()) for p in sorted(SAMPLE_DIR.glob("*.pdf"))]


def _init_session_state() -> None:
    default_preset = list(ROLE_PRESETS.keys())[0]
    st.session_state.setdefault("preset_name", default_preset)
    st.session_state.setdefault("role_title", ROLE_PRESETS[default_preset]["role_title"])
    st.session_state.setdefault("criteria_text", ROLE_PRESETS[default_preset]["criteria"])
    st.session_state.setdefault("must_have_text", ROLE_PRESETS[default_preset]["must_have"])
    st.session_state.setdefault("company_name", "Tim Rekrutmen Perusahaan")
    st.session_state.setdefault("use_sample_cvs", False)
    st.session_state.setdefault("uploader_key", 0)
    st.session_state.setdefault("report", None)
    st.session_state.setdefault("selected_filename", None)
    st.session_state.setdefault("show_invite_for", None)


def _on_preset_change() -> None:
    chosen = st.session_state["preset_name"]
    if chosen in ROLE_PRESETS:
        st.session_state["role_title"] = ROLE_PRESETS[chosen]["role_title"]
        st.session_state["criteria_text"] = ROLE_PRESETS[chosen]["criteria"]
        st.session_state["must_have_text"] = ROLE_PRESETS[chosen]["must_have"]


_init_session_state()

# ---------------------------------------------------------------------------
# Sidebar: Role Criteria & Secure API Key Configuration
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### ⚙️ Konfigurasi Screening")

    preset_options = list(ROLE_PRESETS.keys()) + ["Kustom (Isi Sendiri)"]
    st.selectbox(
        "Preset Role Perusahaan",
        options=preset_options,
        key="preset_name",
        on_change=_on_preset_change,
    )
    role_title = st.text_input("Nama Posisi Target", key="role_title")
    criteria_text = st.text_area("Kriteria Role", key="criteria_text", height=180)
    must_have_text = st.text_area(
        "Syarat Wajib (Must-Have)",
        key="must_have_text",
        height=75,
        help="Opsional — kandidat yang tidak memenuhi syarat wajib utama akan diberi skor lebih ketat.",
    )
    company_name = st.text_input("Nama Perusahaan (untuk Draft Undangan)", key="company_name")

    st.divider()
    st.markdown("### 🔐 Koneksi Gemini API")
    resolved_key, key_source = _resolve_api_key()
    if key_source in ("secrets", "env"):
        source_label = "Streamlit Secrets" if key_source == "secrets" else "Environment Variable"
        st.success(f"API Key aktif via **{source_label}** (aman & tersembunyi saat rekam layar).")
        active_api_key = resolved_key
    else:
        active_api_key = st.text_input(
            "Gemini API Key",
            type="password",
            placeholder="Tempel API Key di sini (otomatis disensor ••••)",
            help="Tips: Simpan di .streamlit/secrets.toml agar tidak perlu input lagi dan tidak pernah muncul di layar.",
        ).strip()
        if not active_api_key:
            st.caption("Ambil API Key gratis di [Google AI Studio](https://aistudio.google.com/apikey).")

    st.caption(f"Engine: `{DEFAULT_REASONING_MODEL}` + RAG `gemini-embedding-001`")

# ---------------------------------------------------------------------------
# Main Hero Header
# ---------------------------------------------------------------------------
st.markdown(
    """
    <div class="saas-hero">
      <div>
        <div class="saas-kicker">Ready-to-Use HR-Tech AI Solution · AI Engineer Bootcamp Ruangguru</div>
        <h1 class="saas-title">AI Bulk CV Screening Tool</h1>
        <div class="saas-subtitle">
          Unggah puluhan CV kandidat sekaligus, terapkan kriteria spesifik perusahaan, dan dapatkan ranking serta rekomendasi kandidat terbaik dalam hitungan detik.
        </div>
      </div>
      <div class="saas-badges">
        <span class="saas-chip">⚡ Streamlit SaaS UI</span>
        <span class="saas-chip">🔍 RAG Embeddings</span>
        <span class="saas-chip">🤖 Parallel AI Agent</span>
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Step 1: Bulk Multi-PDF Upload & Instant Sample Loader
# ---------------------------------------------------------------------------
upload_col, action_col = st.columns([3.2, 1.3], gap="medium")

with upload_col:
    uploaded_files = st.file_uploader(
        "Unggah Banyak CV Kandidat Sekaligus (Format PDF — Drag & Drop)",
        type=["pdf"],
        accept_multiple_files=True,
        key=f"cv_uploader_{st.session_state['uploader_key']}",
        help="Tarik beberapa file CV PDF dari Windows Explorer sekaligus (atau coba folder sample_cvs/ yang sudah disediakan).",
    )
    if uploaded_files:
        st.session_state["use_sample_cvs"] = False

with action_col:
    st.markdown("<div style='height:28px'></div>", unsafe_allow_html=True)
    if st.button("📂 Muat 6 Sample CV PDF", width="stretch"):
        st.session_state["use_sample_cvs"] = True
        st.session_state["uploader_key"] += 1
        st.session_state["report"] = None
        st.session_state["selected_filename"] = None
        st.session_state["show_invite_for"] = None
        st.rerun()
    if st.button("🔄 Reset Hasil", width="stretch"):
        st.session_state["use_sample_cvs"] = False
        st.session_state["uploader_key"] += 1
        st.session_state["report"] = None
        st.session_state["selected_filename"] = None
        st.session_state["show_invite_for"] = None
        st.rerun()

# Assemble active PDF batch
active_files: list[tuple[str, bytes]] = []
if uploaded_files:
    active_files = [(f.name, f.getvalue()) for f in uploaded_files]
elif st.session_state["use_sample_cvs"]:
    active_files = _load_sample_pdf_files()

if active_files:
    names_preview = " · ".join(f"`{name}`" for name, _ in active_files[:6])
    extra_note = f" (+{len(active_files) - 6} lainnya)" if len(active_files) > 6 else ""
    st.info(f"📄 **{len(active_files)} CV siap disaring:** {names_preview}{extra_note}")

run_screening = st.button(
    f"⚡ Mulai Bulk Screening AI ({len(active_files)} CV)" if active_files else "⚡ Mulai Bulk Screening AI",
    type="primary",
    width="stretch",
    disabled=len(active_files) == 0,
)

if run_screening:
    if not active_api_key:
        st.error(
            "Gemini API Key belum terdeteksi. Isi di `.streamlit/secrets.toml` atau masukkan pada sidebar kiri."
        )
    else:
        progress_bar = st.progress(0, text="Menyiapkan ekstraksi multi-PDF & RAG embeddings...")
        status_text = st.empty()

        def _update_progress(done: int, total: int, message: str) -> None:
            pct = int((done / max(total, 1)) * 100)
            progress_bar.progress(min(pct, 100), text=message)
            status_text.caption(f"⏱️ {message}")

        try:
            client = create_gemini_client(active_api_key)
            report = screen_candidates(
                client=client,
                files=active_files,
                role_title=role_title,
                criteria_text=criteria_text,
                must_have_text=must_have_text,
                max_workers=4,
                progress_callback=_update_progress,
            )
            progress_bar.progress(100, text="✅ Bulk screening selesai!")
            status_text.empty()
            st.session_state["report"] = report
            st.session_state["selected_filename"] = (
                report.candidates[0].filename if report.candidates else None
            )
            st.session_state["show_invite_for"] = None
        except Exception as exc:
            progress_bar.empty()
            status_text.empty()
            st.error(f"Gagal menjalankan bulk screening: {exc}")

# ---------------------------------------------------------------------------
# Step 2 & 3: Candidates Ranking Dashboard & AI Recommendation Card
# ---------------------------------------------------------------------------
report: BulkScreeningReport | None = st.session_state.get("report")

if report is not None:
    if report.failed_files:
        with st.expander(f"⚠️ {len(report.failed_files)} file tidak dapat diproses (klik untuk detail)"):
            for item in report.failed_files:
                st.warning(f"**{item.filename}**: {item.reason}")

    if not report.candidates:
        st.warning("Belum ada kandidat yang berhasil dievaluasi dari batch PDF ini.")
    else:
        # Top Hire Spotlight Banner
        top_candidate = report.candidates[0]
        st.markdown(
            render_top_hire_banner(
                top_candidate=top_candidate,
                total_candidates=len(report.candidates),
                elapsed_seconds=report.elapsed_seconds,
            ),
            unsafe_allow_html=True,
        )

        # -------------------------------------------------------------------
        # Section 1: Full-Width Candidates Table (Bounded Height + Right Detail Column)
        # -------------------------------------------------------------------
        hdr_l, hdr_r = st.columns([1.4, 2.6], vertical_alignment="bottom")
        with hdr_l:
            st.markdown("#### 👥 Candidates")
        with hdr_r:
            f1, f2, f3 = st.columns([1.8, 1.15, 0.95])
            with f1:
                search_query = st.text_input(
                    "Cari kandidat",
                    placeholder="🔍 Cari nama atau lokasi...",
                    label_visibility="collapsed",
                ).strip().lower()
            with f2:
                match_filter = st.selectbox(
                    "Filter Match",
                    options=["Semua", "Recommended ✓", "High", "Medium", "Low"],
                    label_visibility="collapsed",
                )
            with f3:
                st.download_button(
                    "⬇️ Export CSV",
                    data=results_to_csv_bytes(report),
                    file_name=safe_csv_filename(report.role_title),
                    mime="text/csv",
                    width="stretch",
                )

        filtered = []
        for item in report.candidates:
            ev = item.evaluation
            if search_query and (
                search_query not in ev.candidate_name.lower()
                and search_query not in ev.location.lower()
            ):
                continue
            if match_filter == "Recommended ✓" and not ev.recommended:
                continue
            if match_filter in ("High", "Medium", "Low") and item.match_level != match_filter:
                continue
            filtered.append(item)

        if filtered and st.session_state.get("selected_filename") not in {c.filename for c in filtered}:
            st.session_state["selected_filename"] = filtered[0].filename

        col_ratios = [2.2, 1.0, 1.45, 0.9, 0.75, 1.05, 1.15]

        with st.container(border=True):
            # Table Header Row
            h_cols = st.columns(col_ratios, vertical_alignment="center")
            headers = [
                ("Nama Kandidat", "left"),
                ("Tahap", "left"),
                ("Lokasi", "left"),
                ("Match", "left"),
                ("Score", "left"),
                ("Recommended", "center"),
                ("Detail", "center"),
            ]
            for col, (title, align) in zip(h_cols, headers):
                col.markdown(
                    f'<div class="tbl-head" style="text-align:{align};">{title}</div>',
                    unsafe_allow_html=True,
                )
            st.markdown('<hr style="border:none;border-top:1.5px solid #E2E8F0;margin:2px 0 8px 0;">', unsafe_allow_html=True)

            if not filtered:
                st.info("Tidak ada kandidat yang cocok dengan filter pencarian saat ini.")
            else:
                # Bounded scrollable body (maks tinggi 330px agar tidak terlalu panjang saat upload banyak CV)
                body_height = min(330, max(92, len(filtered) * 62))
                with st.container(height=body_height, border=False):
                    for idx, item in enumerate(filtered):
                        ev = item.evaluation
                        is_selected = item.filename == st.session_state.get("selected_filename")
                        r_cols = st.columns(col_ratios, vertical_alignment="center")

                        name_cls = "tbl-cell-name active" if is_selected else "tbl-cell-name"
                        active_dot = "● " if is_selected else ""
                        r_cols[0].markdown(
                            f'<div class="{name_cls}">{active_dot}{_safe_inline(ev.candidate_name)}</div>',
                            unsafe_allow_html=True,
                        )
                        r_cols[1].markdown(
                            f'<span class="pill pill-stage">{_safe_inline(item.stage)}</span>',
                            unsafe_allow_html=True,
                        )
                        r_cols[2].markdown(
                            f'<div class="tbl-cell-loc">{_safe_inline(ev.location)}</div>',
                            unsafe_allow_html=True,
                        )
                        r_cols[3].markdown(render_match_pill(item.match_level), unsafe_allow_html=True)
                        score_cls = f"pill-{item.match_level.lower()}"
                        r_cols[4].markdown(
                            f'<span class="score-badge {score_cls}">{ev.overall_score}</span>',
                            unsafe_allow_html=True,
                        )
                        rec_html = (
                            '<div style="text-align:center;color:#0D9488;font-weight:800;font-size:16px;">✓</div>'
                            if ev.recommended
                            else '<div style="text-align:center;color:#EF4444;font-weight:800;font-size:16px;">✕</div>'
                        )
                        r_cols[5].markdown(rec_html, unsafe_allow_html=True)

                        btn_label = "✓ Dipilih" if is_selected else "Lihat Detail"
                        btn_type = "primary" if is_selected else "secondary"
                        if r_cols[6].button(
                            btn_label,
                            key=f"detail_btn_{idx}_{item.filename}",
                            type=btn_type,
                            width="stretch",
                        ):
                            st.session_state["selected_filename"] = item.filename
                            st.rerun()

                        if idx < len(filtered) - 1:
                            st.markdown('<hr class="tbl-row-sep">', unsafe_allow_html=True)

        # -------------------------------------------------------------------
        # Section 2: Full-Width AI Recommendation Details Card Under the Table
        # -------------------------------------------------------------------
        st.markdown("<div style='height:14px'></div>", unsafe_allow_html=True)
        st.markdown("#### ✨ AI Recommendation")

        if not filtered:
            st.info("Ubah filter pencarian untuk melihat detail kandidat.")
        else:
            selected_obj = next(
                (c for c in filtered if c.filename == st.session_state.get("selected_filename")),
                filtered[0],
            )
            st.markdown(render_recommendation_card(selected_obj), unsafe_allow_html=True)

            st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)
            cta_col, _ = st.columns([1.2, 2.0])
            with cta_col:
                if st.button("📅 Buat Draft Undangan Interview", type="primary", width="stretch"):
                    st.session_state["show_invite_for"] = selected_obj.filename

            if st.session_state.get("show_invite_for") == selected_obj.filename:
                invite_text = generate_interview_invite(
                    candidate=selected_obj,
                    role_title=report.role_title,
                    company_name=company_name.strip() or "Tim Rekrutmen Perusahaan",
                )
                st.markdown("##### ✉️ Draft Undangan Siap Salin (WhatsApp / Email)")
                st.code(invite_text, language="markdown")
else:
    st.markdown(
        """
        <div style="background:#FFFFFF;border:1px dashed #CBD5E1;border-radius:16px;padding:30px;text-align:center;color:#475569;margin-top:8px;">
          <div style="font-size:28px;margin-bottom:8px;">📄 ➜ 🤖 ➜ 🏆</div>
          <div style="font-size:16px;font-weight:700;color:#1B2A4A;margin-bottom:6px;">
            Siap Menyaring Puluhan CV dalam Hitungan Detik
          </div>
          <div style="font-size:13.5px;max-width:600px;margin:0 auto;">
            Tarik beberapa file CV PDF ke area unggah di atas — atau klik <strong>📂 Muat 6 Sample CV PDF</strong>
            untuk langsung melihat ranking kandidat, skor <em>Job Match / Experience / Technical Skills</em>, dan rekomendasi interview.
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
