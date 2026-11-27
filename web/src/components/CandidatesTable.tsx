"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  Mail,
  Search,
  X,
} from "lucide-react";
import type {
  BulkScreeningReport,
  MatchLevel,
  ScreenedCandidate,
} from "@/lib/types";

type FilterValue = "all" | "recommended" | MatchLevel;

interface CandidatesTableProps {
  report: BulkScreeningReport | null;
  isScreening: boolean;
  stagedCount: number;
  roleTitle: string;
  selectedCandidateId: string | null;
  onSelectCandidate: (candidate: ScreenedCandidate) => void;
  onInviteCandidate: (candidate: ScreenedCandidate) => void;
  onExportCsv: () => void;
}

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "recommended", label: "Direkomendasikan" },
  { value: "High", label: "Tinggi" },
  { value: "Medium", label: "Sedang" },
  { value: "Low", label: "Rendah" },
];

const AVATAR_TONES = [
  "bg-blue-50 text-blue-700 ring-blue-200/70",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  "bg-amber-50 text-amber-800 ring-amber-200/70",
  "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
  "bg-rose-50 text-rose-700 ring-rose-200/70",
];

function getAvatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function matchLabel(level: MatchLevel): string {
  if (level === "High") return "Tinggi";
  if (level === "Medium") return "Sedang";
  return "Rendah";
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

function scoreBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-600";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-600";
}

export function CandidatesTable({
  report,
  isScreening,
  stagedCount,
  roleTitle,
  selectedCandidateId,
  onSelectCandidate,
  onInviteCandidate,
  onExportCsv,
}: CandidatesTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    setQuery("");
    setFilter("all");
  }, [report]);

  const filteredCandidates = useMemo(() => {
    if (!report) return [];
    const normalizedQuery = query.trim().toLowerCase();

    return report.candidates.filter((c) => {
      if (filter === "recommended" && !c.recommended) return false;
      if (
        (filter === "High" || filter === "Medium" || filter === "Low") &&
        c.matchLevel !== filter
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        c.candidateName.toLowerCase().includes(normalizedQuery) ||
        c.location.toLowerCase().includes(normalizedQuery) ||
        c.filename.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [report, query, filter]);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-8">
      {/* Unified Table Workspace (integrated directly on white background) */}
      <section className="bg-white">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
              Daftar Kandidat
            </h2>
            {report && !isScreening ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-700 tabular-nums">
                {filteredCandidates.length}
              </span>
            ) : null}
            {isScreening ? (
              <span className="text-[13px] font-medium text-blue-700 tabular-nums">
                Menilai {stagedCount || 10} CV untuk {roleTitle}...
              </span>
            ) : null}
          </div>

          {report && !isScreening ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama atau lokasi..."
                  aria-label="Cari kandidat"
                  className="h-8.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8.5 pr-3 text-[16px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none sm:text-[13px]"
                />
              </div>

              <div
                className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5"
                role="group"
                aria-label="Filter kecocokan kandidat"
              >
                {FILTER_OPTIONS.map((opt) => {
                  const active = filter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilter(opt.value)}
                      className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-white text-slate-900 shadow-2xs ring-1 ring-slate-200/80"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {report.candidates.length > 0 ? (
                <button
                  type="button"
                  onClick={onExportCsv}
                  aria-label="Unduh CSV"
                  title="Unduh CSV"
                  className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.97]"
                >
                  <Download className="h-4 w-4" strokeWidth={1.85} />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Bounded-height Scrollable Table (fits viewport cleanly, single scrollbar) */}
        <div className="thin-scroll max-h-[360px] lg:max-h-[calc(100vh-140px)] overflow-x-auto overflow-y-auto overscroll-contain">
          <table className="w-full min-w-[840px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-xs">
              <tr>
                <th scope="col" className="py-3 pl-2 pr-4">
                  Kandidat
                </th>
                <th scope="col" className="px-4 py-3">
                  Tahap
                </th>
                <th scope="col" className="px-4 py-3">
                  Lokasi
                </th>
                <th scope="col" className="px-4 py-3">
                  Kecocokan
                </th>
                <th scope="col" className="px-4 py-3">
                  Skor
                </th>
                <th scope="col" className="px-4 py-3">
                  Rekomendasi
                </th>
                <th scope="col" className="py-3 pl-4 pr-4 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isScreening ? (
                Array.from({
                  length: Math.min(Math.max(stagedCount || 6, 4), 6),
                }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 rounded bg-slate-200" />
                          <div className="h-2.5 w-24 rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-16 rounded-md bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-3.5 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-14 rounded-md bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-3.5 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-8 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="ml-auto h-7 w-32 rounded-md bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : !report || report.candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-[13px] text-slate-500"
                  >
                    Tidak ada kandidat yang berhasil dinilai pada sesi ini.
                    Periksa daftar file yang gagal di bawah.
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-[13px] text-slate-500"
                  >
                    Tidak ada kandidat yang cocok dengan kata kunci atau filter
                    saat ini.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const candidateKey = candidate.id || candidate.filename;
                  const isSelected = selectedCandidateId === candidateKey;
                  return (
                    <tr
                      key={candidateKey}
                      onClick={() => onSelectCandidate(candidate)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? "bg-blue-50/50"
                          : "hover:bg-slate-50/90"
                      }`}
                    >
                      <td className="py-3.5 pl-2 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${getAvatarTone(candidate.candidateName)}`}
                            aria-hidden="true"
                          >
                            {getInitials(candidate.candidateName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {candidate.candidateName}
                            </p>
                            <p className="max-w-[200px] truncate text-[11px] text-slate-500">
                              {candidate.filename}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] font-medium text-slate-700">
                          {candidate.stage}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {candidate.location}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[12px] font-semibold ${matchPillClasses(candidate.matchLevel)}`}
                        >
                          {matchLabel(candidate.matchLevel)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5 tabular-nums">
                          <span className="w-12 font-bold text-slate-900">
                            {candidate.overallScore}/100
                          </span>
                          <div
                            className="hidden h-2 w-16 overflow-hidden rounded-full bg-slate-100 md:block"
                            aria-hidden="true"
                          >
                            <div
                              className={`h-full rounded-full ${scoreBarColor(candidate.overallScore)}`}
                              style={{ width: `${candidate.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {candidate.recommended ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                            <span>Ya</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-400">
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Tidak</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 pl-4 pr-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInviteCandidate(candidate);
                            }}
                            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] ${
                              candidate.recommended
                                ? "btn-primary"
                                : "border border-slate-300 bg-white text-slate-700 shadow-2xs hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                            }`}
                          >
                            <Mail className="h-3.5 w-3.5" strokeWidth={1.85} />
                            <span>Undang</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCandidate(candidate);
                            }}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-2xs transition-all duration-150 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 active:scale-[0.97]"
                          >
                            <span>Detail</span>
                            <ChevronRight
                              className="h-3.5 w-3.5 text-slate-400"
                              strokeWidth={1.75}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Failed / Unreadable Files Notice */}
      {report && report.failedFiles.length > 0 && !isScreening ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>
              {report.failedFiles.length} file tidak dapat diproses:
            </span>
          </div>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-[12px]">
            {report.failedFiles.map((fail, idx) => (
              <li key={`${fail.filename}-${idx}`}>
                <span className="font-medium">{fail.filename}</span> —{" "}
                {fail.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
