"use client";

import { useRef, useState } from "react";
import {
  FileText,
  FolderOpen,
  Loader2,
  Play,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

export interface StagedCvFile {
  id: string;
  name: string;
  sizeBytes: number;
  source: "upload" | "sample";
  file?: File;
  sampleUrl?: string;
}

interface UploadBarProps {
  roleTitle: string;
  stagedFiles: StagedCvFile[];
  isLoadingSamples: boolean;
  isScreening: boolean;
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
  roleTitle,
  stagedFiles,
  isLoadingSamples,
  isScreening,
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
    <section
      aria-label="Unggah CV PDF"
      className="border-b border-[#E6E9EF] bg-[#FFFFFF]"
    >
      <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
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
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 transition-colors duration-150 ${
                isDragging
                  ? "border-[#0F766E] bg-[#F0FDFA]"
                  : "border-[#CBD5E1] bg-[#F7F8FA] hover:border-[#0F766E]/60 hover:bg-[#F0FDFA]/40"
              } ${isScreening ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E6E9EF] bg-[#FFFFFF] text-[#0F766E]"
                  aria-hidden="true"
                >
                  <Upload className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#0F172A]">
                    Tarik dan lepas file CV PDF di sini, atau klik untuk memilih file
                  </p>
                  <p className="text-[12px] text-[#475569]">
                    Maksimal 30 file PDF (hingga 10 MB per file) untuk posisi{" "}
                    <span className="font-medium text-[#0F172A]">{roleTitle}</span>
                  </p>
                </div>
              </div>

              <span className="hidden shrink-0 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-2.5 py-1 text-[12px] font-medium text-[#475569] sm:inline-block">
                Pilih PDF
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <button
              type="button"
              onClick={onLoadSamples}
              disabled={isScreening || isLoadingSamples}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-3 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingSamples ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#475569]" strokeWidth={1.75} />
              ) : (
                <FolderOpen className="h-3.5 w-3.5 text-[#475569]" strokeWidth={1.75} />
              )}
              <span>Muat 6 CV contoh</span>
            </button>

            {stagedFiles.length > 0 ? (
              <button
                type="button"
                onClick={onReset}
                disabled={isScreening}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-2.5 text-[13px] font-medium text-[#475569] transition-colors duration-150 hover:bg-[#F7F8FA] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Reset</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onStartScreening}
              disabled={isScreening || stagedFiles.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0F766E] px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
            >
              {isScreening ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              <span>
                {isScreening
                  ? "Menyaring..."
                  : stagedFiles.length > 0
                    ? `Mulai Screening (${stagedFiles.length})`
                    : "Mulai Screening"}
              </span>
            </button>
          </div>
        </div>

        {stagedFiles.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-medium text-[#475569] tabular-nums">
              Siap diproses ({stagedFiles.length}):
            </span>
            {stagedFiles.map((item) => (
              <span
                key={item.id}
                className="inline-flex max-w-[280px] items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#F7F8FA] py-0.5 pl-2 pr-1 text-[12px] text-[#0F172A]"
              >
                <FileText
                  className="h-3.5 w-3.5 shrink-0 text-[#475569]"
                  strokeWidth={1.75}
                />
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-[11px] text-[#475569] tabular-nums">
                  {formatBytes(item.sizeBytes)}
                </span>
                {!isScreening ? (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(item.id)}
                    aria-label={`Hapus ${item.name}`}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#475569] transition-colors duration-150 hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
