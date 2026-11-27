"use client";

import { ArrowLeft, Briefcase, SlidersHorizontal } from "lucide-react";
import type { RolePreset } from "@/lib/types";

interface TopBarProps {
  presets: RolePreset[];
  selectedPresetId: string;
  roleTitle: string;
  onSelectPreset: (presetId: string) => void;
  onOpenCriteria: () => void;
  onBackToUpload: () => void;
}

export function TopBar({
  presets,
  selectedPresetId,
  roleTitle,
  onSelectPreset,
  onOpenCriteria,
  onBackToUpload,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-[1220px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBackToUpload}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Unggah Ulang</span>
          </button>

          <span
            className="hidden h-5 w-px bg-slate-200 sm:inline-block"
            aria-hidden="true"
          />

          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <Briefcase className="h-3.5 w-3.5" strokeWidth={1.85} />
            </span>
            <select
              id="role-preset-select"
              aria-label="Posisi lowongan"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="h-8.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 pr-7 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-white"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.roleTitle}
                </option>
              ))}
              {selectedPresetId === "custom" ? (
                <option value="custom">{roleTitle || "Posisi Kustom"}</option>
              ) : null}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCriteria}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98]"
          >
            <SlidersHorizontal
              className="h-3.5 w-3.5 text-slate-500"
              strokeWidth={1.75}
            />
            <span>Kriteria</span>
          </button>
        </div>
      </div>
    </header>
  );
}
