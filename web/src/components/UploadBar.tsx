"use client";

import { useRef, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  FolderOpen,
  Loader2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import type { RolePreset } from "@/lib/types";

export interface StagedCvFile {
  id: string;
  name: string;
  sizeBytes: number;
  source: "upload" | "sample";
  file?: File;
  sampleUrl?: string;
}

interface UploadBarProps {
  presets: RolePreset[];
  selectedPresetId: string;
  roleTitle: string;
  mustHaveText: string;
  stagedFiles: StagedCvFile[];
  isLoadingSamples: boolean;
  isScreening: boolean;
  onSelectPreset: (presetId: string) => void;
  onOpenCriteria: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onLoadSamples: () => void;
  onReset: () => void;
  onStartScreening: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadBar({
  presets,
  selectedPresetId,
  roleTitle,
  mustHaveText,
  stagedFiles,
  isLoadingSamples,
  isScreening,
  onSelectPreset,
  onOpenCriteria,
  onAddFiles,
  onRemoveFile,
  onLoadSamples,
  onReset,
  onStartScreening,
}: UploadBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const mustHaveTags = mustHaveText
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isScreening) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (isScreening) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[680px] flex-col justify-center px-4 py-12 sm:px-6">
      {/* Centered Header */}
      <div className="text-center">
        <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.28)]">
          <Briefcase className="h-5 w-5" strokeWidth={1.85} />
        </div>
        <h1 className="mt-4 text-[26px] font-bold tracking-tight text-slate-900">
          Penyaringan CV
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-slate-600">
          Pilih posisi lowongan dan unggah kumpulan CV PDF untuk menyusun
          peringkat kandidat beserta draf undangan wawancara.
        </p>
      </div>

      {/* Unified Symmetric Setup & Upload Sheet */}
      <div className="surface-card mt-7 overflow-hidden rounded-2xl">
        {/* Band 1: Role & Criteria */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label
                htmlFor="setup-role-select"
                className="block text-[12px] font-semibold text-slate-700"
              >
                Posisi Lowongan
              </label>
              <select
                id="setup-role-select"
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                disabled={isScreening}
                className="mt-1.5 h-9.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900 shadow-2xs transition-colors hover:border-slate-300 focus:border-blue-600 focus:outline-none"
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

            <button
              type="button"
              onClick={onOpenCriteria}
              disabled={isScreening}
              className="inline-flex h-9.5 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] disabled:opacity-50"
            >
              <SlidersHorizontal
                className="h-3.5 w-3.5 text-slate-500"
                strokeWidth={1.75}
              />
              <span>Atur Kriteria</span>
            </button>
          </div>

          {mustHaveTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-slate-500">
                Syarat utama:
              </span>
              {mustHaveTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  <CheckCircle2
                    className="h-3 w-3 text-emerald-600"
                    strokeWidth={2}
                  />
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Band 2: PDF Dropzone + Staged File List */}
        <div className="p-6">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            disabled={isScreening}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />

          <div
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isScreening && inputRef.current?.click()}
            role="button"
            tabIndex={isScreening ? -1 : 0}
            aria-disabled={isScreening}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isScreening) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-150 ${
              isDragging
                ? "border-blue-600 bg-blue-50/60"
                : "border-slate-200 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/30"
            } ${isScreening ? "pointer-events-none opacity-60" : ""}`}
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-xs">
              <Upload className="h-5 w-5" strokeWidth={1.85} />
            </div>
            <p className="mt-3.5 text-[14px] font-semibold text-slate-900">
              Tarik &amp; lepas file CV PDF ke sini
            </p>
            <p className="mt-1 text-[12.5px] text-slate-500">
              atau{" "}
              <span className="font-semibold text-blue-700 underline underline-offset-2">
                pilih dari komputer
              </span>{" "}
              · Maksimal 30 file PDF (10 MB/file)
            </p>
          </div>

          {stagedFiles.length > 0 ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="font-semibold text-slate-800 tabular-nums">
                  {stagedFiles.length} file siap dinilai
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  disabled={isScreening}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                  <span>Hapus semua</span>
                </button>
              </div>
              <div className="thin-scroll mt-2.5 max-h-44 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {stagedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 text-[12px]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.85} />
                      </span>
                      <span className="truncate font-medium text-slate-800">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {formatBytes(item.sizeBytes)}
                      </span>
                      {!isScreening ? (
                        <button
                          type="button"
                          onClick={() => onRemoveFile(item.id)}
                          aria-label={`Hapus ${item.name}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Band 3: Footer Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isScreening || isLoadingSamples}
            className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoadingSamples ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-slate-500"
                strokeWidth={1.75}
              />
            ) : (
              <FolderOpen
                className="h-3.5 w-3.5 text-slate-500"
                strokeWidth={1.75}
              />
            )}
            <span>Muat 6 CV contoh</span>
          </button>

          <button
            type="button"
            onClick={onStartScreening}
            disabled={isScreening || stagedFiles.length === 0}
            className="btn-primary inline-flex h-9.5 items-center gap-1.5 rounded-lg px-4.5 text-[13px] font-semibold transition-all disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isScreening ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Play className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            <span>
              {isScreening
                ? "Memproses..."
                : stagedFiles.length > 0
                  ? `Mulai Penyaringan (${stagedFiles.length})`
                  : "Mulai Penyaringan"}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
