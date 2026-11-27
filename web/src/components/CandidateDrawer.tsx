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

  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (candidate) {
      setDisplayCandidate(candidate);
    } else {
      const timer = window.setTimeout(() => setDisplayCandidate(null), 190);
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
        onClose();
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
  }, [isOpen, onClose]);

  if (!displayCandidate) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end transition-opacity duration-[180ms] ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      aria-labelledby="candidate-drawer-title"
    >
      <div
        className="fixed inset-0 bg-zinc-950/25"
        onClick={isOpen ? onClose : undefined}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`relative z-10 flex h-full w-full max-w-[500px] flex-col border-l border-zinc-200 bg-white shadow-xl transition-transform duration-[180ms] ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with quick Invite action right at the top */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[13px] font-semibold text-zinc-700"
              aria-hidden="true"
            >
              {getInitials(displayCandidate.candidateName)}
            </span>
            <div className="min-w-0">
              <h2
                id="candidate-drawer-title"
                className="break-words text-[17px] font-semibold tracking-tight text-zinc-950"
              >
                {displayCandidate.candidateName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
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
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[12px] font-semibold text-zinc-900 tabular-nums">
                  Skor {displayCandidate.overallScore}/100
                </span>
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium ${matchPillClasses(displayCandidate.matchLevel)}`}
                >
                  {matchLabel(displayCandidate.matchLevel)}
                </span>
                {displayCandidate.recommended ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={2} />
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
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-[12px] font-medium text-white hover:bg-zinc-800"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Undang</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={onClose}
              aria-label="Tutup detail kandidat"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="thin-scroll flex-1 divide-y divide-zinc-200 overflow-y-auto px-6">
          {/* Score Breakdown */}
          <section className="py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-zinc-950">
                Rincian Penilaian
              </h3>
              <span className="text-[12px] text-zinc-500 tabular-nums">
                Relevansi Kata Kunci: {displayCandidate.ragScore}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
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
            <h3 className="text-[13px] font-semibold text-zinc-950">
              Ringkasan
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              {displayCandidate.summary}
            </p>
          </section>

          {/* Strengths & Gaps */}
          <section className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[13px] font-semibold text-zinc-950">
                Kelebihan Utama
              </h3>
              <ul className="mt-2.5 space-y-2">
                {displayCandidate.strengths.map((item, idx) => (
                  <li
                    key={`str-${idx}`}
                    className="flex items-start gap-2 text-[13px] leading-snug text-zinc-600"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                      strokeWidth={1.75}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-zinc-950">
                Celah &amp; Catatan
              </h3>
              <ul className="mt-2.5 space-y-2">
                {displayCandidate.gaps.map((item, idx) => (
                  <li
                    key={`gap-${idx}`}
                    className="flex items-start gap-2 text-[13px] leading-snug text-zinc-600"
                  >
                    <AlertCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                      strokeWidth={1.75}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Interview Focus Areas */}
          <section className="py-5">
            <h3 className="text-[13px] font-semibold text-zinc-950">
              Topik Wawancara
            </h3>
            <ol className="mt-3 space-y-2.5">
              {displayCandidate.interviewFocusAreas.map((focus, idx) => (
                <li
                  key={`focus-${idx}`}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-zinc-600"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-700 tabular-nums">
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
