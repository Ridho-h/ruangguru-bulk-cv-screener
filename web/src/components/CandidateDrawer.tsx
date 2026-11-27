"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import type { MatchLevel, ScreenedCandidate } from "@/lib/types";
import { DonutGauge } from "./DonutGauge";

interface CandidateDrawerProps {
  candidate: ScreenedCandidate | null;
  onClose: () => void;
  onInviteCandidate: (candidate: ScreenedCandidate) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function matchLabel(level: MatchLevel): string {
  if (level === "High") return "Kecocokan Tinggi";
  if (level === "Medium") return "Kecocokan Sedang";
  return "Kecocokan Rendah";
}

function matchPillClasses(level: MatchLevel): string {
  if (level === "High") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (level === "Medium") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export function CandidateDrawer({
  candidate,
  onClose,
  onInviteCandidate,
}: CandidateDrawerProps) {
  const isOpen = Boolean(candidate);
  const [displayCandidate, setDisplayCandidate] =
    useState<ScreenedCandidate | null>(candidate);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (candidate) {
      setDisplayCandidate(candidate);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    } else {
      setVisible(false);
      const timer = window.setTimeout(() => setDisplayCandidate(null), 210);
      return () => window.clearTimeout(timer);
    }
  }, [candidate]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!displayCandidate) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end transition-opacity duration-200 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      aria-labelledby="candidate-drawer-title"
      onWheel={(e) => {
        if (
          scrollRef.current &&
          !scrollRef.current.contains(e.target as Node)
        ) {
          scrollRef.current.scrollTop += e.deltaY;
        }
      }}
    >
      <div
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-[1px]"
        onClick={isOpen ? onClose : undefined}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`relative z-10 flex h-full w-full max-w-[520px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Tinted Header Band */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[14px] font-bold text-blue-800 ring-1 ring-blue-200"
              aria-hidden="true"
            >
              {getInitials(displayCandidate.candidateName)}
            </span>
            <div className="min-w-0">
              <h2
                id="candidate-drawer-title"
                className="break-words text-[17px] font-bold tracking-tight text-slate-900"
              >
                {displayCandidate.candidateName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {displayCandidate.location}
                </span>
                <span className="inline-flex items-center gap-1 truncate">
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="max-w-[180px] truncate">
                    {displayCandidate.filename}
                  </span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-[12px] font-bold text-slate-900 shadow-2xs tabular-nums">
                  Skor {displayCandidate.overallScore}/100
                </span>
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[12px] font-semibold ${matchPillClasses(displayCandidate.matchLevel)}`}
                >
                  {matchLabel(displayCandidate.matchLevel)}
                </span>
                {displayCandidate.recommended ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={2.25} />
                    Direkomendasikan
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => onInviteCandidate(displayCandidate)}
              className="btn-primary inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold transition-all"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.85} />
              <span>Undang</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={onClose}
              aria-label="Tutup detail kandidat"
              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="thin-scroll flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain px-6"
        >
          {/* Score Breakdown */}
          <section className="py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-900">
                Rincian Penilaian
              </h3>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
                Relevansi Kata Kunci {displayCandidate.ragScore}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <DonutGauge
                label="Kecocokan Peran"
                value={displayCandidate.jobMatchScore}
              />
              <DonutGauge
                label="Pengalaman"
                value={displayCandidate.experienceScore}
              />
              <DonutGauge
                label="Skill Teknis"
                value={displayCandidate.technicalSkillsScore}
              />
            </div>
          </section>

          {/* Summary */}
          <section className="py-5">
            <h3 className="text-[13px] font-bold text-slate-900">Ringkasan</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              {displayCandidate.summary}
            </p>
          </section>

          {/* Strengths & Gaps */}
          <section className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5">
              <h3 className="text-[12px] font-bold text-emerald-900">
                Kelebihan Utama
              </h3>
              <ul className="mt-2.5 space-y-2">
                {displayCandidate.strengths.map((item, idx) => (
                  <li
                    key={`str-${idx}`}
                    className="flex items-start gap-2 text-[12.5px] leading-snug text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                      strokeWidth={2}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5">
              <h3 className="text-[12px] font-bold text-amber-900">
                Celah &amp; Catatan
              </h3>
              <ul className="mt-2.5 space-y-2">
                {displayCandidate.gaps.map((item, idx) => (
                  <li
                    key={`gap-${idx}`}
                    className="flex items-start gap-2 text-[12.5px] leading-snug text-slate-700"
                  >
                    <AlertCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                      strokeWidth={2}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Interview Focus Areas */}
          <section className="py-5">
            <h3 className="text-[13px] font-bold text-slate-900">
              Topik Wawancara
            </h3>
            <ol className="mt-3 space-y-2.5">
              {displayCandidate.interviewFocusAreas.map((focus, idx) => (
                <li
                  key={`focus-${idx}`}
                  className="flex items-start gap-3 text-[13px] leading-snug text-slate-700"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200/70 tabular-nums">
                    {idx + 1}
                  </span>
                  <span>{focus}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
