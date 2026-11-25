"use client";

import { Download, FileSearch, SlidersHorizontal } from "lucide-react";
import type { RolePreset } from "@/lib/types";

interface TopBarProps {
  presets: RolePreset[];
  selectedPresetId: string;
  roleTitle: string;
  onSelectPreset: (presetId: string) => void;
  onOpenCriteria: () => void;
  canExport: boolean;
  onExportCsv: () => void;
}

export function TopBar({
  presets,
  selectedPresetId,
  roleTitle,
  onSelectPreset,
  onOpenCriteria,
  canExport,
  onExportCsv,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E6E9EF] bg-[#F7F8FA]/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0F766E] text-white"
              aria-hidden="true"
            >
              <FileSearch className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#0F172A]">
              Screening CV
            </h1>
          </div>

          <span
            className="hidden h-4 w-px bg-[#E6E9EF] sm:inline-block"
            aria-hidden="true"
          />

          <div className="hidden items-center gap-2 sm:flex">
            <label
              htmlFor="role-preset-select"
              className="text-[12px] font-medium text-[#475569]"
            >
              Posisi
            </label>
            <select
              id="role-preset-select"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="h-8 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-2.5 pr-7 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#CBD5E1]"
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-3 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F1F5F9]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#475569]" strokeWidth={1.75} />
            <span>Atur Kriteria</span>
          </button>

          {canExport ? (
            <button
              type="button"
              onClick={onExportCsv}
              aria-label="Export CSV"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-2.5 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F1F5F9] sm:px-3"
            >
              <Download className="h-3.5 w-3.5 text-[#475569]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Responsive mobile role selector */}
      <div className="flex items-center gap-2 border-t border-[#E6E9EF] px-4 py-2 sm:hidden">
        <label
          htmlFor="role-preset-select-mobile"
          className="shrink-0 text-[12px] font-medium text-[#475569]"
        >
          Posisi
        </label>
        <select
          id="role-preset-select-mobile"
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-2.5 text-[13px] font-medium text-[#0F172A]"
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
    </header>
  );
}
