"use client";

import { ArrowLeft, Briefcase, SlidersHorizontal } from "lucide-react";

interface TopBarProps {
  roleTitle: string;
  isScreening: boolean;
  onOpenCriteria: () => void;
  onBackToUpload: () => void;
}

export function TopBar({
  roleTitle,
  isScreening,
  onOpenCriteria,
  onBackToUpload,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1220px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            disabled={isScreening}
            onClick={onBackToUpload}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Unggah Ulang</span>
          </button>

          <span
            className="hidden h-4 w-px bg-slate-200 sm:inline-block"
            aria-hidden="true"
          />

          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <Briefcase className="h-3.5 w-3.5" strokeWidth={1.85} />
            </span>
            <span className="truncate text-[13.5px] font-semibold text-slate-900">
              {roleTitle || "Posisi Kustom"}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isScreening}
          onClick={onOpenCriteria}
          className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] disabled:opacity-50"
        >
          <SlidersHorizontal
            className="h-3.5 w-3.5 text-slate-500"
            strokeWidth={1.75}
          />
          <span>Kriteria &amp; Posisi</span>
        </button>
      </div>
    </header>
  );
}
