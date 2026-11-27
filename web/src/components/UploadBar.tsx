"use client";

import { useRef, useState } from "react";
import {
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
    <main className="mx-auto flex min-h-[82vh] max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950">
          Penyaringan CV
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-zinc-600">
          Pilih posisi lowongan, lalu unggah file CV dalam format PDF untuk
          menyusun peringkat kandidat dan draf undangan wawancara.
        </p>
      </div>

      {/* Role & Criteria row */}
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label
            htmlFor="setup-role-select"
            className="block text-[12px] font-medium text-zinc-600"
          >
            Posisi Lowongan
          </label>
          <select
            id="setup-role-select"
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            disabled={isScreening}
            className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] font-medium text-zinc-900 hover:border-zinc-400"
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
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          <SlidersHorizontal
            className="h-3.5 w-3.5 text-zinc-500"
            strokeWidth={1.75}
          />
          <span>Atur Kriteria</span>
        </button>
      </div>

      {/* Dropzone */}
      <div className="mt-4">
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
          className={`cursor-pointer rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150 ${
            isDragging
              ? "border-teal-700 bg-teal-50/40"
              : "border-zinc-300 bg-zinc-50/60 hover:border-zinc-400 hover:bg-zinc-50"
          } ${isScreening ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700">
            <Upload className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <p className="mt-3 text-[14px] font-medium text-zinc-900">
            Tarik dan lepas file CV PDF di sini, atau klik untuk memilih
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Format PDF · Maksimal 30 file (10 MB per file)
          </p>
        </div>
      </div>

      {/* Staged file chips */}
      {stagedFiles.length > 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3.5">
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <span className="font-medium text-zinc-700 tabular-nums">
              {stagedFiles.length} file siap dinilai
            </span>
            <button
              type="button"
              onClick={onReset}
              disabled={isScreening}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
              <span>Hapus semua</span>
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {stagedFiles.map((item) => (
              <span
                key={item.id}
                className="inline-flex max-w-[260px] items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 py-1 pl-2 pr-1 text-[12px] text-zinc-800"
              >
                <FileText
                  className="h-3.5 w-3.5 shrink-0 text-zinc-500"
                  strokeWidth={1.75}
                />
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-[11px] text-zinc-500 tabular-nums">
                  {formatBytes(item.sizeBytes)}
                </span>
                {!isScreening ? (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(item.id)}
                    aria-label={`Hapus ${item.name}`}
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900"
                  >
                    <X className="h-3 w-3" strokeWidth={1.75} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onLoadSamples}
          disabled={isScreening || isLoadingSamples}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          {isLoadingSamples ? (
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-zinc-500"
              strokeWidth={1.75}
            />
          ) : (
            <FolderOpen
              className="h-3.5 w-3.5 text-zinc-500"
              strokeWidth={1.75}
            />
          )}
          <span>Muat 6 CV contoh</span>
        </button>

        <button
          type="button"
          onClick={onStartScreening}
          disabled={isScreening || stagedFiles.length === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isScreening ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
          ) : (
            <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
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
    </main>
  );
}
