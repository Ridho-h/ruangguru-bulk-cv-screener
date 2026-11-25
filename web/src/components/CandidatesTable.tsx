"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FolderOpen,
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
  onLoadSamples: () => void;
}

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "recommended", label: "Direkomendasikan" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function matchPillClasses(level: MatchLevel): string {
  if (level === "High") {
    return "bg-[#ECFDF5] text-[#15803D] border-[#A7F3D0]";
  }
  if (level === "Medium") {
    return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  }
  return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
}

function scoreBarColor(score: number): string {
  if (score >= 75) return "bg-[#0F766E]";
  if (score >= 50) return "bg-[#B45309]";
  return "bg-[#B91C1C]";
}

export function CandidatesTable({
  report,
  isScreening,
  stagedCount,
  roleTitle,
  selectedCandidateId,
  onSelectCandidate,
  onLoadSamples,
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
    <main className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6">
      {/* Summary Strip (flat hairline bar, no nested KPI cards) */}
      {report && !isScreening ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#E6E9EF] pb-3.5 text-[13px]">
          <div className="flex items-baseline gap-2">
            <span className="text-[#475569]">Kandidat teratas:</span>
            <span className="font-semibold text-[#0F172A]">
              {topCandidate
                ? `${topCandidate.candidateName} (${topCandidate.overallScore}/100)`
                : "-"}
            </span>
          </div>
          <span
            className="hidden h-3.5 w-px bg-[#E6E9EF] sm:inline-block"
            aria-hidden="true"
          />
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[#475569]">Direkomendasikan:</span>
            <span className="font-semibold text-[#15803D]">
              {report.recommendedCount} / {report.totalScreened}
            </span>
          </div>
          <span
            className="hidden h-3.5 w-px bg-[#E6E9EF] sm:inline-block"
            aria-hidden="true"
          />
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[#475569]">Diproses:</span>
            <span className="font-medium text-[#0F172A]">
              {report.totalScreened} CV
            </span>
          </div>
          <span
            className="hidden h-3.5 w-px bg-[#E6E9EF] sm:inline-block"
            aria-hidden="true"
          />
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[#475569]">Durasi:</span>
            <span className="font-medium text-[#0F172A]">
              {(report.durationMs / 1000).toFixed(1)} dtk
            </span>
          </div>
        </div>
      ) : null}

      {/* Table Header & Controls */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">
            Candidates
          </h2>
          {report && !isScreening ? (
            <span className="rounded-full bg-[#F7F8FA] px-2 py-0.5 text-[12px] font-medium text-[#475569] ring-1 ring-[#E6E9EF] tabular-nums">
              {filteredCandidates.length}
            </span>
          ) : null}
          {isScreening ? (
            <span className="text-[13px] text-[#0F766E] tabular-nums">
              Menyaring {stagedCount || 6} CV untuk {roleTitle}...
            </span>
          ) : null}
        </div>

        {report && !isScreening ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#475569]"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau lokasi..."
                aria-label="Cari kandidat"
                className="h-8 w-full rounded-md border border-[#E6E9EF] bg-[#FFFFFF] pl-8 pr-2.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] sm:text-[13px]"
              />
            </div>

            <div
              className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-md border border-[#E6E9EF] bg-[#F7F8FA] p-0.5"
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
                        ? "bg-[#FFFFFF] text-[#0F766E] shadow-2xs ring-1 ring-[#E6E9EF]"
                        : "text-[#475569] hover:text-[#0F172A]"
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
      <div className="overflow-hidden rounded-lg border border-[#E6E9EF] bg-[#FFFFFF]">
        <div className="thin-scroll max-h-[360px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-[#E6E9EF] bg-[#F7F8FA] text-[12px] font-medium text-[#475569]">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Nama Kandidat
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Tahap
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Lokasi
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Match
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Score
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Recommended
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E9EF] bg-[#FFFFFF]">
              {isScreening ? (
                Array.from({ length: Math.min(Math.max(stagedCount || 6, 4), 6) }).map(
                  (_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[#E6E9EF]" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 rounded bg-[#E6E9EF]" />
                            <div className="h-2.5 w-24 rounded bg-[#F1F5F9]" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-16 rounded-full bg-[#F1F5F9]" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3.5 w-20 rounded bg-[#E6E9EF]" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-14 rounded-full bg-[#F1F5F9]" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3.5 w-16 rounded bg-[#E6E9EF]" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-4 rounded-full bg-[#E6E9EF]" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="ml-auto h-7 w-16 rounded-md bg-[#F1F5F9]" />
                      </td>
                    </tr>
                  ),
                )
              ) : !report ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-[14px] font-medium text-[#0F172A]">
                      Belum ada hasil screening
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[13px] text-[#475569]">
                      Unggah beberapa file CV PDF di area atas atau muat 6 CV contoh
                      bawaan untuk melihat peringkat dan rekomendasi wawancara.
                    </p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={onLoadSamples}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E9EF] bg-[#F7F8FA] px-3 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#E2E8F0]/60"
                      >
                        <FolderOpen
                          className="h-3.5 w-3.5 text-[#0F766E]"
                          strokeWidth={1.75}
                        />
                        <span>Muat 6 CV contoh</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : report.candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-[13px] text-[#475569]"
                  >
                    Tidak ada kandidat yang berhasil dievaluasi pada sesi ini. Periksa
                    daftar file yang gagal di bawah.
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-[13px] text-[#475569]"
                  >
                    Tidak ada kandidat yang cocok dengan kata kunci atau filter saat ini.
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
                        isSelected ? "bg-[#F0FDFA]" : "hover:bg-[#F7F8FA]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F7F8FA] text-[11px] font-semibold text-[#0F766E] ring-1 ring-[#E6E9EF]"
                            aria-hidden="true"
                          >
                            {getInitials(candidate.candidateName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#0F172A]">
                              {candidate.candidateName}
                            </p>
                            <p className="max-w-[220px] truncate text-[11px] text-[#475569]">
                              {candidate.filename}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-0.5 text-[12px] font-medium text-[#6D28D9]">
                          {candidate.stage}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[#475569]">
                        {candidate.location}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${matchPillClasses(candidate.matchLevel)}`}
                        >
                          {candidate.matchLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="w-12 font-semibold text-[#0F172A]">
                            {candidate.overallScore}/100
                          </span>
                          <div
                            className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[#E6E9EF] md:block"
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
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#15803D]">
                            <Check className="h-4 w-4" strokeWidth={2} />
                            <span>Ya</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#B91C1C]">
                            <X className="h-4 w-4" strokeWidth={2} />
                            <span>Tidak</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(candidate);
                          }}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-2.5 text-[12px] font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#0F766E] hover:text-[#0F766E]"
                        >
                          <span>Detail</span>
                          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
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
          className="mt-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] text-[#92400E]"
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
                <span className="font-medium">{fail.filename}</span> — {fail.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
