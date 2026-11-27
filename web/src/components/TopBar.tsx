"use client";

import { ArrowLeft, Download, SlidersHorizontal } from "lucide-react";
import type { RolePreset } from "@/lib/types";

interface TopBarProps {
  presets: RolePreset[];
  selectedPresetId: string;
  roleTitle: string;
  onSelectPreset: (presetId: string) => void;
  onOpenCriteria: () => void;
  canExport: boolean;
  onExportCsv: () => void;
  onBackToUpload: () => void;
}

export function TopBar({
  presets,
  selectedPresetId,
  roleTitle,
  onSelectPreset,
  onOpenCriteria,
  canExport,
  onExportCsv,
  onBackToUpload,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBackToUpload}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Unggah Ulang</span>
          </button>

          <span
            className="hidden h-4 w-px bg-zinc-200 sm:inline-block"
            aria-hidden="true"
          />

          <div className="hidden items-center gap-2 sm:flex">
            <label
              htmlFor="role-preset-select"
              className="text-[12px] font-medium text-zinc-500"
            >
              Posisi
            </label>
            <select
              id="role-preset-select"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 pr-7 text-[13px] font-medium text-zinc-900 transition-colors hover:border-zinc-300"
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            <SlidersHorizontal
              className="h-3.5 w-3.5 text-zinc-500"
              strokeWidth={1.75}
            />
            <span>Kriteria</span>
          </button>

          {canExport ? (
            <button
              type="button"
              onClick={onExportCsv}
              aria-label="Unduh CSV"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50 sm:px-3"
            >
              <Download
                className="h-3.5 w-3.5 text-zinc-500"
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">Unduh CSV</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
