"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { generateInterviewInvite } from "@/lib/export";
import type { MatchLevel, ScreenedCandidate } from "@/lib/types";
import { DonutGauge } from "./DonutGauge";

interface CandidateDrawerProps {
  candidate: ScreenedCandidate | null;
  roleTitle: string;
  companyName: string;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function matchPillClasses(level: MatchLevel): string {
  if (level === "High") {
    return "bg-[#ECFDF5] text-[#15803D] border-[#A7F3D0]";
  }
  if (level === "Medium") {
    return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  }
  return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
}

export function CandidateDrawer({
  candidate,
  roleTitle,
  companyName,
  onClose,
}: CandidateDrawerProps) {
  const isOpen = Boolean(candidate);
  const [displayCandidate, setDisplayCandidate] =
    useState<ScreenedCandidate | null>(candidate);
  const [showInvite, setShowInvite] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const inviteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (candidate) {
      setDisplayCandidate(candidate);
    } else {
      const timer = window.setTimeout(() => setDisplayCandidate(null), 190);
      return () => window.clearTimeout(timer);
    }
  }, [candidate]);

  useEffect(() => {
    setShowInvite(false);
    setCopyStatus("idle");
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, [candidate?.id, candidate?.filename]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

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

  const inviteText = useMemo(() => {
    if (!displayCandidate) return "";
    return generateInterviewInvite(displayCandidate, roleTitle, companyName);
  }, [displayCandidate, roleTitle, companyName]);

  const handleCopyInvite = async () => {
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteText);
      } else if (inviteTextareaRef.current) {
        inviteTextareaRef.current.select();
        document.execCommand("copy");
      } else {
        throw new Error("Clipboard unavailable");
      }
      setCopyStatus("copied");
    } catch {
      if (inviteTextareaRef.current) {
        inviteTextareaRef.current.select();
      }
      setCopyStatus("failed");
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyTimerRef.current = null;
    }, 2200);
  };

  if (!displayCandidate) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-[180ms] ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      aria-labelledby="candidate-drawer-title"
    >
      <div
        className="fixed inset-0 bg-[#0F172A]/25"
        onClick={isOpen ? onClose : undefined}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`relative z-10 flex h-full w-full max-w-[500px] flex-col border-l border-[#E6E9EF] bg-[#FFFFFF] shadow-xl transition-transform duration-[180ms] ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E6E9EF] px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-[13px] font-semibold text-[#0F766E] ring-1 ring-[#CCFBF1]"
              aria-hidden="true"
            >
              {getInitials(displayCandidate.candidateName)}
            </span>
            <div className="min-w-0">
              <h2
                id="candidate-drawer-title"
                className="break-words text-[17px] font-semibold tracking-tight text-[#0F172A]"
              >
                {displayCandidate.candidateName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#475569]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#475569]" strokeWidth={1.75} />
                  {displayCandidate.location}
                </span>
                <span className="inline-flex items-center gap-1 truncate">
                  <FileText className="h-3.5 w-3.5 text-[#475569]" strokeWidth={1.75} />
                  <span className="max-w-[180px] truncate">{displayCandidate.filename}</span>
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#E6E9EF] bg-[#F7F8FA] px-2.5 py-0.5 text-[12px] font-semibold text-[#0F172A] tabular-nums">
                  Score {displayCandidate.overallScore}/100
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${matchPillClasses(displayCandidate.matchLevel)}`}
                >
                  {displayCandidate.matchLevel} Match
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${
                    displayCandidate.recommended
                      ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#15803D]"
                      : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
                  }`}
                >
                  {displayCandidate.recommended ? (
                    <Check className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <X className="h-3 w-3" strokeWidth={2} />
                  )}
                  {displayCandidate.recommended
                    ? "Recommended"
                    : "Belum Direkomendasikan"}
                </span>
              </div>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            aria-label="Tutup detail kandidat"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#475569] transition-colors duration-150 hover:bg-[#F7F8FA] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Content (hairline sections, no nested cards) */}
        <div className="thin-scroll flex-1 divide-y divide-[#E6E9EF] overflow-y-auto px-6">
          {/* AI Recommendation Gauges */}
          <section className="py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-[#0F172A]">
                AI Recommendation
              </h3>
              <span className="text-[12px] text-[#475569] tabular-nums">
                Kemiripan RAG: {displayCandidate.ragScore}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <DonutGauge label="Job Match" value={displayCandidate.jobMatchScore} />
              <DonutGauge label="Experience" value={displayCandidate.experienceScore} />
              <DonutGauge
                label="Technical Skills"
                value={displayCandidate.technicalSkillsScore}
              />
            </div>
          </section>

          {/* Summary */}
          <section className="py-5">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">Ringkasan</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">
              {displayCandidate.summary}
            </p>
          </section>

          {/* Strengths & Gaps */}
          <section className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[13px] font-semibold text-[#0F172A]">
                Kelebihan Utama
              </h3>
              <ul className="mt-2.5 space-y-2">
                {displayCandidate.strengths.map((item, idx) => (
                  <li
                    key={`str-${idx}`}
                    className="flex items-start gap-2 text-[13px] leading-snug text-[#475569]"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803D]"
                      strokeWidth={1.75}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-[#0F172A]">
                Celah &amp; Catatan
              </h3>
              <ul className="mt-2.5 space-y-2">
                {displayCandidate.gaps.map((item, idx) => (
                  <li
                    key={`gap-${idx}`}
                    className="flex items-start gap-2 text-[13px] leading-snug text-[#475569]"
                  >
                    <AlertCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B45309]"
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
            <h3 className="text-[13px] font-semibold text-[#0F172A]">
              Interview Focus Areas
            </h3>
            <ol className="mt-3 space-y-2.5">
              {displayCandidate.interviewFocusAreas.map((focus, idx) => (
                <li
                  key={`focus-${idx}`}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-[#0F172A]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F7F8FA] text-[11px] font-semibold text-[#0F766E] ring-1 ring-[#E6E9EF] tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="text-[#475569]">{focus}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Inline Interview Invite Draft */}
          <section className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => setShowInvite((prev) => !prev)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0F766E] px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#115E59]"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>
                  {showInvite ? "Sembunyikan Draft Undangan" : "Buat Draft Undangan"}
                </span>
              </button>

              {showInvite ? (
                <button
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={handleCopyInvite}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-3 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F7F8FA]"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#15803D]" strokeWidth={2} />
                      <span className="text-[#15803D]">Tersalin</span>
                    </>
                  ) : copyStatus === "failed" ? (
                    <span className="text-[#B45309]">Pilih &amp; salin manual</span>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#475569]" strokeWidth={1.75} />
                      <span>Salin Teks</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {showInvite ? (
              <div className="mt-3">
                <label htmlFor="interview-invite-textarea" className="sr-only">
                  Draft undangan wawancara
                </label>
                <textarea
                  ref={inviteTextareaRef}
                  id="interview-invite-textarea"
                  tabIndex={isOpen ? 0 : -1}
                  readOnly
                  rows={11}
                  value={inviteText}
                  className="w-full rounded-md border border-[#E6E9EF] bg-[#F7F8FA] p-3 text-[12px] leading-relaxed text-[#0F172A]"
                />
              </div>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}
