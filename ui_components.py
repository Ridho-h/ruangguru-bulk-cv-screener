"""Komponen visual SaaS HR-Tech minimal (CSS, Match Pills, SVG Donut Gauges, Recommendation Card)."""

from __future__ import annotations

import html
import math

import pandas as pd

from screener_engine import ScreenedCandidate

SVG_CHECK = (
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Recommended">'
    '<path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    "</svg>"
)
SVG_CROSS = (
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Not recommended">'
    '<path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="#DC2626" stroke-width="2" stroke-linecap="round"/>'
    "</svg>"
)


def get_saas_css() -> str:
    """Stylesheet bersih dan minimal bergaya SaaS HR-Tech."""
    return """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    html, body, .stApp {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .stApp {
        background-color: #F8FAFC;
    }
    .block-container {
        padding-top: 1.4rem !important;
        padding-bottom: 2.5rem !important;
        max-width: 1380px !important;
    }
    .page-header {
        padding-bottom: 14px;
        margin-bottom: 18px;
        border-bottom: 1px solid #E2E8F0;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
    }
    .page-title {
        font-size: 24px;
        font-weight: 700;
        color: #0F172A;
        margin: 0;
        letter-spacing: -0.02em;
    }
    .page-sub {
        font-size: 13.5px;
        color: #64748B;
        margin-top: 4px;
    }
    .role-tag {
        font-size: 12px;
        font-weight: 600;
        color: #0F766E;
        background: #F0FDFA;
        border: 1px solid #CCFBF1;
        padding: 4px 12px;
        border-radius: 999px;
    }
    .summary-strip {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-left: 4px solid #00A8B5;
        border-radius: 12px;
        padding: 16px 22px;
        margin: 12px 0 20px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
    }
    .summary-kicker {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #64748B;
        margin-bottom: 3px;
    }
    .summary-name {
        font-size: 18px;
        font-weight: 700;
        color: #0F172A;
    }
    .summary-loc {
        font-size: 13px;
        font-weight: 500;
        color: #64748B;
    }
    .summary-note {
        font-size: 13px;
        color: #475569;
        margin-top: 4px;
        max-width: 680px;
    }
    .summary-metrics {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    .metric-box {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 8px 14px;
        text-align: center;
        min-width: 90px;
    }
    .metric-val {
        font-size: 17px;
        font-weight: 700;
        color: #0F172A;
        line-height: 1.15;
    }
    .metric-lbl {
        font-size: 11px;
        color: #64748B;
        margin-top: 2px;
    }
    .section-heading {
        font-size: 16px;
        font-weight: 700;
        color: #0F172A;
        margin: 4px 0 10px 0;
    }
    .tbl-head {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748B;
        padding: 4px 2px 6px 2px;
    }
    .tbl-cell-name {
        font-size: 13.5px;
        font-weight: 600;
        color: #0F172A;
    }
    .tbl-cell-name.active {
        color: #0E7490;
        font-weight: 700;
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
    .rec-card {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 14px;
        padding: 22px 24px;
    }
    .rec-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding-bottom: 16px;
        border-bottom: 1px solid #F1F5F9;
        margin-bottom: 18px;
    }
    .rec-identity {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .avatar-circle {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #0F172A;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .rec-kicker {
        font-size: 12px;
        color: #64748B;
        font-weight: 500;
    }
    .rec-name {
        font-size: 18px;
        font-weight: 700;
        color: #0F172A;
        line-height: 1.25;
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
        border-radius: 12px;
        padding: 12px 10px;
        text-align: center;
    }
    .gauge-label {
        font-size: 12px;
        font-weight: 500;
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
        font-size: 19px;
        font-weight: 700;
        color: #0F172A;
    }
    .rec-body-grid {
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        gap: 20px;
        align-items: start;
    }
    @media (max-width: 900px) {
        .rec-body-grid {
            grid-template-columns: 1fr;
        }
    }
    .summary-quote {
        background: #F8FAFC;
        border-left: 3px solid #00A8B5;
        padding: 10px 14px;
        border-radius: 0 8px 8px 0;
        font-size: 13px;
        color: #1E293B;
        margin-bottom: 14px;
        line-height: 1.5;
    }
    .two-col-mini {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .mini-box {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 11px 14px;
    }
    .mini-title {
        font-size: 12px;
        font-weight: 700;
        color: #0F172A;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
    }
    .mini-list {
        margin: 0;
        padding-left: 17px;
        font-size: 13px;
        color: #475569;
        line-height: 1.55;
    }
    .focus-title {
        font-size: 13px;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 10px;
    }
    .focus-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #F0F9FF;
        border: 1px solid #E0F2FE;
        border-radius: 10px;
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
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .pill {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.3;
    }
    .pill-high { background: #DCFCE7; color: #15803D; }
    .pill-medium { background: #FEF3C7; color: #B45309; }
    .pill-low { background: #FEE2E2; color: #B91C1C; }
    .pill-stage { background: #F3E8FF; color: #6D28D9; }
    .pill-rec { background: #CCFBF1; color: #0F766E; }
    .score-badge {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 7px;
        font-weight: 700;
        font-size: 12.5px;
    }
    .empty-state {
        background: #FFFFFF;
        border: 1px dashed #CBD5E1;
        border-radius: 12px;
        padding: 28px 20px;
        text-align: center;
        color: #64748B;
        font-size: 13.5px;
        margin-top: 8px;
    }
    </style>
    """


def _compact_html(raw: str) -> str:
    """Hapus indentasi dan baris kosong agar CommonMark tidak merender HTML sebagai code block."""
    return "\n".join(line.strip() for line in raw.splitlines() if line.strip())


def _safe_inline(text: str) -> str:
    """Escape HTML dan normalisasi newline menjadi spasi."""
    return html.escape(" ".join((text or "").split()))


def render_match_pill(match_level: str) -> str:
    level = match_level if match_level in ("High", "Medium", "Low") else "Low"
    return f'<span class="pill pill-{level.lower()}">{html.escape(level)}</span>'


def render_recommended_icon(recommended: bool) -> str:
    svg = SVG_CHECK if recommended else SVG_CROSS
    return f'<div style="display:flex;justify-content:center;align-items:center;">{svg}</div>'


def render_donut_gauge(label: str, percent: int, color: str = "#00A8B5") -> str:
    """Render 1 SVG circular progress gauge dengan clamp 0..100."""
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
            <svg width="36" height="36" viewBox="0 0 38 38" role="img" aria-label="{safe_label} {clamped}%">
              <circle cx="19" cy="19" r="{radius:.1f}" fill="none" stroke="#E2E8F0" stroke-width="4" />
              <circle cx="19" cy="19" r="{radius:.1f}" fill="none" stroke="{safe_color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="{circumference:.2f}" stroke-dashoffset="{dashoffset:.2f}" transform="rotate(-90 19 19)" />
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
    recommended_count: int | None = None,
) -> str:
    ev = top_candidate.evaluation
    safe_name = _safe_inline(ev.candidate_name)
    safe_summary = _safe_inline(ev.one_line_summary)
    safe_loc = _safe_inline(ev.location)
    rec_text = (
        f"{recommended_count}/{total_candidates}"
        if recommended_count is not None
        else f"{total_candidates} CV"
    )
    rec_label = "Direkomendasikan" if recommended_count is not None else "Disaring"

    return _compact_html(
        f"""
        <div class="summary-strip">
          <div>
            <div class="summary-kicker">Kandidat Teratas</div>
            <div><span class="summary-name">{safe_name}</span> <span class="summary-loc">· {safe_loc}</span></div>
            <div class="summary-note">{safe_summary}</div>
          </div>
          <div class="summary-metrics">
            <div class="metric-box">
              <div class="metric-val" style="color:#0F766E">{ev.overall_score}/100</div>
              <div class="metric-lbl">Skor Tertinggi</div>
            </div>
            <div class="metric-box">
              <div class="metric-val">{rec_text}</div>
              <div class="metric-lbl">{rec_label}</div>
            </div>
            <div class="metric-box">
              <div class="metric-val">{elapsed_seconds:.1f} dtk</div>
              <div class="metric-lbl">Durasi</div>
            </div>
          </div>
        </div>
        """
    )


def render_candidates_table_html(
    candidates: list[ScreenedCandidate],
    selected_filename: str | None = None,
) -> str:
    """Helper HTML tabel kandidat untuk kebutuhan pengujian/ekspor."""
    rows: list[str] = []
    for item in candidates:
        ev = item.evaluation
        is_sel = item.filename == selected_filename
        row_cls = ' class="selected-row"' if is_sel else ""
        pill_html = render_match_pill(item.match_level)
        score_cls = f"pill-{item.match_level.lower()}"
        rows.append(
            f'<tr{row_cls}>'
            f'<td><strong>{_safe_inline(ev.candidate_name)}</strong></td>'
            f'<td><span class="pill pill-stage">{_safe_inline(item.stage)}</span></td>'
            f'<td>{_safe_inline(ev.location)}</td>'
            f'<td>{pill_html}</td>'
            f'<td><span class="score-badge {score_cls}">{ev.overall_score}</span></td>'
            f'<td>{render_recommended_icon(ev.recommended)}</td>'
            f'</tr>'
        )
    body = "\n".join(rows) if rows else '<tr><td colspan="6">Tidak ada kandidat.</td></tr>'
    return _compact_html(
        f"""
        <div>
          <table>
            <thead>
              <tr><th>Nama</th><th>Tahap</th><th>Lokasi</th><th>Match</th><th>Score</th><th>Recommended</th></tr>
            </thead>
            <tbody>{body}</tbody>
          </table>
        </div>
        """
    )


def build_styled_candidates_df(candidates: list[ScreenedCandidate]):
    """Helper Pandas DataFrame terformat untuk ekspor atau tampilan alternatif."""
    rows = [
        {
            "Nama Kandidat": item.evaluation.candidate_name,
            "Tahap": item.stage,
            "Lokasi": item.evaluation.location,
            "Match": item.match_level,
            "Score": item.evaluation.overall_score,
            "Recommended": "Ya" if item.evaluation.recommended else "Tidak",
        }
        for item in candidates
    ]
    return pd.DataFrame(rows)


def render_recommendation_card(candidate: ScreenedCandidate) -> str:
    """Render kartu AI Recommendation bersih (3 donut gauges + ringkasan + 3 Interview Focus Areas)."""
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
        '<span class="pill pill-rec">Recommended</span>'
        if ev.recommended
        else '<span class="pill pill-low">Not Recommended</span>'
    )

    return _compact_html(
        f"""
        <div class="rec-card">
          <div class="rec-header">
            <div class="rec-identity">
              <div class="avatar-circle">{initials}</div>
              <div>
                <div class="rec-kicker">Skor Keseluruhan {ev.overall_score}/100</div>
                <div class="rec-name">{safe_name}</div>
                <div class="rec-loc">{safe_loc} · Kemiripan Profil {candidate.rag_similarity:.0%}</div>
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
                <strong>Ringkasan:</strong> {safe_summary}
              </div>
              <div class="two-col-mini">
                <div class="mini-box">
                  <div class="mini-title">Kelebihan Utama</div>
                  <ul class="mini-list">{strengths_li}</ul>
                </div>
                <div class="mini-box">
                  <div class="mini-title">Celah &amp; Catatan</div>
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
