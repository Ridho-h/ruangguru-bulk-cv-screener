"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { generateInterviewInvite } from "@/lib/export";
import type { ScreenedCandidate } from "@/lib/types";

interface InviteModalProps {
  candidate: ScreenedCandidate | null;
  roleTitle: string;
  companyName: string;
  onClose: () => void;
}

export function InviteModal({
  candidate,
  roleTitle,
  companyName,
  onClose,
}: InviteModalProps) {
  const [draftText, setDraftText] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const initialDraft = useMemo(() => {
    if (!candidate) return "";
    return generateInterviewInvite(candidate, roleTitle, companyName);
  }, [candidate, roleTitle, companyName]);

  useEffect(() => {
    setDraftText(initialDraft);
    setCopyStatus("idle");
  }, [initialDraft]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!candidate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [candidate, onClose]);

  if (!candidate) return null;

  const handleCopy = async () => {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draftText);
      } else if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
      } else {
        throw new Error("Clipboard unavailable");
      }
      setCopyStatus("copied");
    } catch {
      textareaRef.current?.select();
      setCopyStatus("failed");
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyTimerRef.current = null;
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="invite-modal-title"
              className="text-[15px] font-semibold text-zinc-900"
            >
              Undangan Wawancara — {candidate.candidateName}
            </h2>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Posisi {roleTitle} · Anda bisa menyunting teks sebelum menyalin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal undangan"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5">
          <label htmlFor="invite-draft-textarea" className="sr-only">
            Draf pesan undangan wawancara
          </label>
          <textarea
            ref={textareaRef}
            id="invite-draft-textarea"
            rows={12}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 text-[13px] leading-relaxed text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/70 px-5 py-3.5 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
          >
            {copyStatus === "copied" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
                <span>Tersalin</span>
              </>
            ) : copyStatus === "failed" ? (
              <span>Salin manual</span>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Salin Undangan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
