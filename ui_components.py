"""Komponen visual SaaS HR-Tech (CSS, Match Pills, SVG Donut Gauges, AI Recommendation Card)."""

from __future__ import annotations

import html
import math

import pandas as pd

from screener_engine import ScreenedCandidate


def get_saas_css() -> str:
    """Stylesheet modern bergaya SaaS HR-Tech (putih bersih, card floating, badge pastel, aksen teal)."""
    return """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    .stApp {
        background-color: #F7F9FC;
    }
    .block-container {
        padding-top: 1.5rem !important;
        padding-bottom: 2.5rem !important;
        max-width: 1420px !important;
    }
    [data-testid="stDataFrame"] {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        padding: 6px;
        box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
    }
    .saas-hero {
        background: linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%);
        border: 1px solid #E2E8F0;
        border-radius: 18px;
        padding: 22px 28px;
        margin-bottom: 18px;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }
    .saas-kicker {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #00A8B5;
        margin-bottom: 4px;
    }
    .saas-title {
        font-size: 26px;
        font-weight: 800;
        color: #1B2A4A;
        margin: 0;
        line-height: 1.2;
    }
    .saas-subtitle {
        font-size: 14px;
        color: #475569;
        margin-top: 5px;
    }
    .saas-badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .saas-chip {
        background: #FFFFFF;
        border: 1px solid #CBD5E1;
        color: #334155;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
    }
    .top-hire-banner {
        background: linear-gradient(135deg, #1B2A4A 0%, #0F3D56 100%);
        color: #FFFFFF;
        border-radius: 16px;
        padding: 20px 26px;
        margin: 10px 0 20px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        box-shadow: 0 10px 28px rgba(27, 42, 74, 0.14);
    }
    .top-hire-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #5EEAD4;
        margin-bottom: 4px;
    }
    .top-hire-name {
        font-size: 21px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0;
    }
    .top-hire-summary {
        font-size: 13.5px;
        color: #CBD5E1;
        margin-top: 4px;
        max-width: 720px;
    }
    .top-hire-stats {
        display: flex;
        gap: 14px;
        align-items: center;
    }
    .stat-pill {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 10px 16px;
        text-align: center;
        min-width: 96px;
    }
    .stat-val {
        font-size: 20px;
        font-weight: 800;
        color: #FFFFFF;
        line-height: 1.1;
    }
    .stat-lbl {
        font-size: 11px;
        color: #94A3B8;
        margin-top: 2px;
    }
    .rec-card {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 18px;
        padding: 22px 24px;
        box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
    }
    .rec-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding-bottom: 16px;
        border-bottom: 1px solid #F1F5F9;
        margin-bottom: 16px;
    }
    .rec-identity {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .avatar-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00A8B5, #0E7490);
        color: #FFFFFF;
        font-weight: 800;
        font-size: 17px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .rec-kicker {
        font-size: 12px;
        color: #64748B;
        font-weight: 600;
    }
    .rec-name {
        font-size: 19px;
        font-weight: 800;
        color: #1B2A4A;
        line-height: 1.2;
    }
    .rec-loc {
        font-size: 12.5px;
        color: #64748B;
        margin-top: 2px;
    }
    .gauges-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 18px;
    }
    .gauge-box {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 14px;
        padding: 12px 10px;
        text-align: center;
    }
    .gauge-label {
        font-size: 12px;
        font-weight: 600;
        color: #64748B;
        margin-bottom: 8px;
    }
    .gauge-inline {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    .gauge-pct {
        font-size: 20px;
        font-weight: 800;
        color: #1B2A4A;
    }
    .summary-quote {
        background: #F0FDFA;
        border-left: 3.5px solid #00A8B5;
        padding: 11px 14px;
        border-radius: 0 10px 10px 0;
        font-size: 13.5px;
        color: #1E293B;
        margin-bottom: 16px;
    }
    .rec-body-grid {
        display: grid;
        grid-template-columns: 1.08fr 1fr;
        gap: 20px;
        align-items: start;
    }
    @media (max-width: 900px) {
        .rec-body-grid {
            grid-template-columns: 1fr;
        }
    }
    .tbl-head {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #64748B;
        padding: 4px 2px 6px 2px;
    }
    .tbl-cell-name {
        font-size: 14px;
        font-weight: 700;
        color: #1B2A4A;
    }
    .tbl-cell-name.active {
        color: #0E7490;
    }
    .tbl-cell-loc {
        font-size: 13px;
        color: #475569;
    }
    .tbl-row-sep {
        border: none;
        border-top: 1px solid #F1F5F9;
        margin: 6px 0;
    }
    .two-col-mini {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .mini-box {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 11px 14px;
    }
    .mini-title {
        font-size: 12.5px;
        font-weight: 700;
        color: #1B2A4A;
        margin-bottom: 5px;
    }
    .mini-list {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
    }
    .focus-title {
        font-size: 14px;
        font-weight: 800;
        color: #1B2A4A;
        margin-bottom: 10px;
    }
    .focus-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #F0F9FF;
        border: 1px solid #E0F2FE;
        border-radius: 11px;
        padding: 10px 12px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #1E293B;
        line-height: 1.45;
    }
    .focus-num {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: #FFFFFF;
        border: 1px solid #BAE6FD;
        color: #0369A1;
        font-size: 12px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .pill {
        display: inline-block;
        padding: 4px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
    }
    .pill-high { background: #DCFCE7; color: #15803D; }
    .pill-medium { background: #FEF3C7; color: #B45309; }
    .pill-low { background: #FEE2E2; color: #B91C1C; }
    .pill-stage { background: #EDE9FE; color: #6D28D9; }
    .pill-rec { background: #CCFBF1; color: #0F766E; }
    .cand-table-wrap {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        padding: 14px 16px;
        box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
    }
    table.cand-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }
    table.cand-table th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #64748B;
        padding: 10px 8px;
        border-bottom: 1.5px solid #E2E8F0;
    }
    table.cand-table td {
        padding: 11px 8px;
        border-bottom: 1px solid #F1F5F9;
        color: #1E293B;
        vertical-align: middle;
    }
    table.cand-table tr.selected-row {
        background: #F0FDFA;
    }
    .score-badge {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 12.5px;
    }
    </style>
    """


def _compact_html(raw: str) -> str:
    """Hapus indentasi & baris kosong agar CommonMark Streamlit tidak pernah mengubah HTML menjadi <pre><code>."""
    return "\n".join(line.strip() for line in raw.splitlines() if line.strip())


def _safe_inline(text: str) -> str:
    """Escape HTML dan normalisasi newline menjadi spasi agar aman di dalam blok HTML."""
    return html.escape(" ".join((text or "").split()))


def render_match_pill(match_level: str) -> str:
    level = match_level if match_level in ("High", "Medium", "Low") else "Low"
    css_class = f"pill-{level.lower()}"
    return f'<span class="pill {css_class}">{html.escape(level)}</span>'


def render_donut_gauge(label: str, percent: int, color: str = "#00A8B5") -> str:
    """Render 1 SVG circular donut progress gauge dengan clamp 0..100 dan escaping HTML aman."""
    clamped = max(0, min(100, int(percent)))
    radius = 15.0
    circumference = 2.0 * math.pi * radius
    dashoffset = circumference * (1.0 - clamped / 100.0)
    safe_label = _safe_inline(label)
    safe_color = _safe_inline(color)

    return _compact_html(
        f"""
        <div class="gauge-box">
          <div class="gauge-label">{safe_label}</div>
          <div class="gauge-inline">
            <svg width="38" height="38" viewBox="0 0 38 38" role="img" aria-label="{safe_label} {clamped}%">
              <circle cx="19" cy="19" r="{radius:.1f}" fill="none" stroke="#E2E8F0" stroke-width="4.2" />
              <circle cx="19" cy="19" r="{radius:.1f}" fill="none" stroke="{safe_color}" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="{circumference:.2f}" stroke-dashoffset="{dashoffset:.2f}" transform="rotate(-90 19 19)" />
            </svg>
            <span class="gauge-pct">{clamped}%</span>
          </div>
        </div>
        """
    )


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "CV"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def render_top_hire_banner(
    top_candidate: ScreenedCandidate,
    total_candidates: int,
    elapsed_seconds: float,
) -> str:
    ev = top_candidate.evaluation
    safe_name = _safe_inline(ev.candidate_name)
    safe_summary = _safe_inline(ev.one_line_summary)
    safe_loc = _safe_inline(ev.location)

    return _compact_html(
        f"""
        <div class="top-hire-banner">
          <div>
            <div class="top-hire-label">🏆 Rekomendasi Terbaik untuk Direkrut (Top Candidate #1)</div>
            <div class="top-hire-name">{safe_name} · <span style="font-weight:500;font-size:14px;color:#94A3B8">{safe_loc}</span></div>
            <div class="top-hire-summary">{safe_summary}</div>
          </div>
          <div class="top-hire-stats">
            <div class="stat-pill">
              <div class="stat-val" style="color:#5EEAD4">{ev.overall_score}/100</div>
              <div class="stat-lbl">Top Score</div>
            </div>
            <div class="stat-pill">
              <div class="stat-val">{total_candidates} CV</div>
              <div class="stat-lbl">Disaring</div>
            </div>
            <div class="stat-pill">
              <div class="stat-val">{elapsed_seconds:.1f} dtk</div>
              <div class="stat-lbl">Waktu Total</div>
            </div>
          </div>
        </div>
        """
    )


def build_styled_candidates_df(candidates: list[ScreenedCandidate]):
    """Bangun Pandas Styler bergaya SaaS untuk tabel st.dataframe yang bisa diklik langsung per baris."""
    rows = []
    for item in candidates:
        ev = item.evaluation
        rows.append(
            {
                "Nama Kandidat": ev.candidate_name,
                "Tahap": item.stage,
                "Lokasi": ev.location,
                "Match": item.match_level,
                "Score": ev.overall_score,
                "Rec.": "✓" if ev.recommended else "✕",
            }
        )

    df = pd.DataFrame(
        rows,
        columns=["Nama Kandidat", "Tahap", "Lokasi", "Match", "Score", "Rec."],
    )

    def _style_match(val: str) -> str:
        if val == "High":
            return "background-color: #DCFCE7; color: #15803D; font-weight: 700;"
        if val == "Medium":
            return "background-color: #FEF3C7; color: #B45309; font-weight: 700;"
        return "background-color: #FEE2E2; color: #B91C1C; font-weight: 700;"

    def _style_score(val: int) -> str:
        if val >= 75:
            return "color: #15803D; font-weight: 800;"
        if val >= 50:
            return "color: #B45309; font-weight: 800;"
        return "color: #B91C1C; font-weight: 800;"

    def _style_rec(val: str) -> str:
        if val == "✓":
            return "color: #0D9488; font-weight: 800; text-align: center;"
        return "color: #EF4444; font-weight: 800; text-align: center;"

    def _style_stage(_: str) -> str:
        return "background-color: #F3E8FF; color: #6D28D9; font-weight: 600;"

    return (
        df.style.map(_style_match, subset=["Match"])
        .map(_style_score, subset=["Score"])
        .map(_style_rec, subset=["Rec."])
        .map(_style_stage, subset=["Tahap"])
    )


def render_candidates_table_html(
    candidates: list[ScreenedCandidate],
    selected_filename: str | None = None,
) -> str:
    """Render tabel ranking kandidat bergaya SaaS (Nama, Stage, Lokasi, Match, Score, Recommended)."""
    rows: list[str] = []
    for item in candidates:
        ev = item.evaluation
        is_sel = item.filename == selected_filename
        row_cls = ' class="selected-row"' if is_sel else ""
        pill_html = render_match_pill(item.match_level)
        score_cls = f"pill-{item.match_level.lower()}"
        rec_icon = (
            '<span style="color:#0D9488;font-weight:800;font-size:15px;">✓</span>'
            if ev.recommended
            else '<span style="color:#EF4444;font-weight:800;font-size:15px;">✕</span>'
        )
        rows.append(
            f'<tr{row_cls}>'
            f'<td><strong>{_safe_inline(ev.candidate_name)}</strong></td>'
            f'<td><span class="pill pill-stage">{_safe_inline(item.stage)}</span></td>'
            f'<td style="color:#475569;">{_safe_inline(ev.location)}</td>'
            f'<td>{pill_html}</td>'
            f'<td><span class="score-badge {score_cls}">{ev.overall_score}</span></td>'
            f'<td style="text-align:center;">{rec_icon}</td>'
            f'</tr>'
        )

    body = "\n".join(rows) if rows else (
        '<tr><td colspan="6" style="text-align:center;color:#64748B;padding:24px;">Tidak ada kandidat yang cocok dengan filter.</td></tr>'
    )
    return _compact_html(
        f"""
        <div class="cand-table-wrap">
          <table class="cand-table">
            <thead>
              <tr>
                <th>Nama Kandidat</th>
                <th>Tahap</th>
                <th>Lokasi</th>
                <th>Match</th>
                <th>Score</th>
                <th style="text-align:center;">Recommended</th>
              </tr>
            </thead>
            <tbody>
              {body}
            </tbody>
          </table>
        </div>
        """
    )


def render_recommendation_card(candidate: ScreenedCandidate) -> str:
    """Render kartu detail AI Recommendation (persis referensi video: 3 donut gauges + 3 Interview Focus Areas)."""
    ev = candidate.evaluation
    safe_name = _safe_inline(ev.candidate_name)
    safe_loc = _safe_inline(ev.location)
    safe_summary = _safe_inline(ev.one_line_summary)
    initials = _safe_inline(_initials(ev.candidate_name))

    def _gauge_color(val: int) -> str:
        if val >= 75:
            return "#00A8B5"
        if val >= 50:
            return "#F59E0B"
        return "#EF4444"

    gauges_html = (
        render_donut_gauge("Job Match", ev.job_match_score, _gauge_color(ev.job_match_score))
        + render_donut_gauge("Experience", ev.experience_score, _gauge_color(ev.experience_score))
        + render_donut_gauge("Technical Skills", ev.technical_skills_score, _gauge_color(ev.technical_skills_score))
    )

    strengths_li = "".join(f"<li>{_safe_inline(s)}</li>" for s in ev.key_strengths[:3]) or "<li>-</li>"
    gaps_li = "".join(f"<li>{_safe_inline(g)}</li>" for g in ev.key_gaps[:3]) or "<li>-</li>"

    focus_items = "\n".join(
        f'<div class="focus-item"><div class="focus-num">{idx}</div><div>{_safe_inline(area)}</div></div>'
        for idx, area in enumerate(ev.interview_focus_areas[:3], start=1)
    )

    rec_badge = (
        '<span class="pill pill-rec">✓ Recommended</span>'
        if ev.recommended
        else '<span class="pill pill-low">Belum Direkomendasikan</span>'
    )

    return _compact_html(
        f"""
        <div class="rec-card">
          <div class="rec-header">
            <div class="rec-identity">
              <div class="avatar-circle">{initials}</div>
              <div>
                <div class="rec-kicker">AI Recommendation · Overall Score {ev.overall_score}/100</div>
                <div class="rec-name">{safe_name}</div>
                <div class="rec-loc">📍 {safe_loc} · RAG Similarity {candidate.rag_similarity:.0%}</div>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
              {render_match_pill(candidate.match_level)}
              {rec_badge}
            </div>
          </div>
          <div class="gauges-row">
            {gauges_html}
          </div>
          <div class="rec-body-grid">
            <div>
              <div class="summary-quote">
                <strong>Ringkasan AI:</strong> {safe_summary}
              </div>
              <div class="two-col-mini">
                <div class="mini-box">
                  <div class="mini-title">✅ Keunggulan Utama</div>
                  <ul class="mini-list">{strengths_li}</ul>
                </div>
                <div class="mini-box">
                  <div class="mini-title">⚠️ Celah / Perlu Verifikasi</div>
                  <ul class="mini-list">{gaps_li}</ul>
                </div>
              </div>
            </div>
            <div>
              <div class="focus-title">Interview Focus Areas</div>
              {focus_items}
            </div>
          </div>
        </div>
        """
    )
