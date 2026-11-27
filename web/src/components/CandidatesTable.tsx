"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
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
}

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "recommended", label: "Direkomendasikan" },
  { value: "High", label: "Tinggi" },
  { value: "Medium", label: "Sedang" },
  { value: "Low", label: "Rendah" },
];

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

  const topCandidate = report?.candidates[0] ?? null;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      {/* Summary Strip */}
      {report && !isScreening ? (
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-200 pb-4 text-[13px]">
          <div className="flex items-baseline gap-2">
            <span className="text-zinc-500">Peringkat 1:</span>
            <span className="font-semibold text-zinc-950">
              {topCandidate
                ? `${topCandidate.candidateName} (${topCandidate.overallScore}/100)`
                : "-"}
            </span>
          </div>
          <span
            className="hidden h-3.5 w-px bg-zinc-200 sm:inline-block"
            aria-hidden="true"
          />
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-zinc-500">Direkomendasikan:</span>
            <span className="font-semibold text-emerald-700">
              {report.recommendedCount} dari {report.totalScreened}
            </span>
          </div>
          <span
            className="hidden h-3.5 w-px bg-zinc-200 sm:inline-block"
            aria-hidden="true"
          />
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-zinc-500">Waktu proses:</span>
            <span className="font-medium text-zinc-900">
              {(report.durationMs / 1000).toFixed(1)} dtk
            </span>
          </div>
        </div>
      ) : null}

      {/* Table Header & Controls */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[16px] font-semibold tracking-tight text-zinc-950">
            Daftar Kandidat
          </h2>
          {report && !isScreening ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[12px] font-medium text-zinc-600 tabular-nums">
              {filteredCandidates.length}
            </span>
          ) : null}
          {isScreening ? (
            <span className="text-[13px] text-zinc-600 tabular-nums">
              Menilai {stagedCount || 6} CV untuk {roleTitle}...
            </span>
          ) : null}
        </div>

        {report && !isScreening ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau lokasi..."
                aria-label="Cari kandidat"
                className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2.5 text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none sm:text-[13px]"
              />
            </div>

            <div
              className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5"
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
                    className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ${
                      active
                        ? "bg-white text-zinc-950 shadow-2xs ring-1 ring-zinc-200"
                        : "text-zinc-600 hover:text-zinc-950"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bounded-height Scrollable Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="thin-scroll max-h-[360px] lg:max-h-[560px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-[12px] font-medium text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Kandidat
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Tahap
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Lokasi
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Kecocokan
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Skor
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Rekomendasi
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200 bg-white">
              {isScreening ? (
                Array.from({
                  length: Math.min(Math.max(stagedCount || 6, 4), 6),
                }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-zinc-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 rounded bg-zinc-200" />
                          <div className="h-2.5 w-24 rounded bg-zinc-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-16 rounded-full bg-zinc-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-20 rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-14 rounded-full bg-zinc-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-16 rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto h-7 w-28 rounded-md bg-zinc-100" />
                    </td>
                  </tr>
                ))
              ) : !report || report.candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-[13px] text-zinc-500"
                  >
                    Tidak ada kandidat yang berhasil dinilai pada sesi ini.
                    Periksa daftar file yang gagal di bawah.
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-[13px] text-zinc-500"
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
                        isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-700"
                            aria-hidden="true"
                          >
                            {getInitials(candidate.candidateName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-950">
                              {candidate.candidateName}
                            </p>
                            <p className="max-w-[200px] truncate text-[11px] text-zinc-500">
                              {candidate.filename}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[12px] font-medium text-zinc-700">
                          {candidate.stage}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {candidate.location}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium ${matchPillClasses(candidate.matchLevel)}`}
                        >
                          {matchLabel(candidate.matchLevel)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="w-12 font-semibold text-zinc-950">
                            {candidate.overallScore}/100
                          </span>
                          <div
                            className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-zinc-200 md:block"
                            aria-hidden="true"
                          >
                            <div
                              className={`h-full rounded-full ${scoreBarColor(candidate.overallScore)}`}
                              style={{ width: `${candidate.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {candidate.recommended ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
                            <Check className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Ya</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500">
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Tidak</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInviteCandidate(candidate);
                            }}
                            className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2.5 text-[12px] font-medium transition-all duration-150 active:scale-[0.97] ${
                              candidate.recommended
                                ? "bg-[#0F766E] text-white hover:bg-[#115E59] hover:shadow-xs"
                                : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                            }`}
                          >
                            <Mail className="h-3 w-3" strokeWidth={1.75} />
                            <span>Undang</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCandidate(candidate);
                            }}
                            className="inline-flex h-7 cursor-pointer items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-800 transition-all duration-150 hover:border-zinc-400 hover:bg-zinc-100 active:scale-[0.97]"
                          >
                            <span>Detail</span>
                            <ChevronRight
                              className="h-3.5 w-3.5 text-zinc-400"
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
      </div>

      {/* Failed / Unreadable Files Notice */}
      {report && report.failedFiles.length > 0 && !isScreening ? (
        <div
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
        >
          <div className="flex items-center gap-2 font-medium">
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
