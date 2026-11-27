"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { CandidateDrawer } from "@/components/CandidateDrawer";
import { CandidatesTable } from "@/components/CandidatesTable";
import { CriteriaDrawer } from "@/components/CriteriaDrawer";
import { InviteModal } from "@/components/InviteModal";
import { TopBar } from "@/components/TopBar";
import { UploadBar, type StagedCvFile } from "@/components/UploadBar";
import { resultsToCsv, safeCsvFilename } from "@/lib/export";
import { ROLE_PRESETS } from "@/lib/presets";
import type {
  BulkScreeningReport,
  FailedFile,
  ScreenedCandidate,
} from "@/lib/types";

const DEFAULT_PRESET = ROLE_PRESETS[0];
const MAX_STAGED_FILES = 30;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function ScreeningWorkspacePage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    DEFAULT_PRESET.id,
  );
  const [roleTitle, setRoleTitle] = useState<string>(DEFAULT_PRESET.roleTitle);
  const [companyName, setCompanyName] = useState<string>(
    DEFAULT_PRESET.companyName,
  );
  const [criteriaText, setCriteriaText] = useState<string>(
    DEFAULT_PRESET.criteriaText,
  );
  const [mustHaveText, setMustHaveText] = useState<string>(
    DEFAULT_PRESET.mustHaveText,
  );

  const [stagedFiles, setStagedFiles] = useState<StagedCvFile[]>([]);
  const [totalBundledSamples, setTotalBundledSamples] = useState<number>(10);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [report, setReport] = useState<BulkScreeningReport | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<ScreenedCandidate | null>(null);
  const [inviteCandidate, setInviteCandidate] =
    useState<ScreenedCandidate | null>(null);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const handleSelectPreset = useCallback((presetId: string) => {
    const found = ROLE_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setRoleTitle(found.roleTitle);
    setCompanyName(found.companyName);
    setCriteriaText(found.criteriaText);
    setMustHaveText(found.mustHaveText);
  }, []);

  const handleAddFiles = useCallback((incoming: FileList | File[]) => {
    const fileArray = Array.from(incoming);
    const warnings: string[] = [];

    const validPdfs: File[] = [];
    for (const file of fileArray) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        warnings.push(`${file.name} bukan PDF`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        warnings.push(`${file.name} melebihi 10 MB`);
        continue;
      }
      validPdfs.push(file);
    }

    setStagedFiles((prev) => {
      const remainingSlots = Math.max(0, MAX_STAGED_FILES - prev.length);
      if (validPdfs.length > remainingSlots) {
        warnings.push(
          `batas maksimal ${MAX_STAGED_FILES} file tercapai (sebagian file dilewati)`,
        );
      }
      const accepted = validPdfs.slice(0, remainingSlots);
      const additions: StagedCvFile[] = accepted.map((file, idx) => ({
        id: `upload-${Date.now()}-${idx}-${file.name}`,
        name: file.name,
        sizeBytes: file.size,
        source: "upload",
        file,
      }));
      return [...prev, ...additions];
    });

    if (warnings.length > 0) {
      setErrorMessage(
        `Sebagian file tidak ditambahkan: ${warnings.join("; ")}.`,
      );
    } else {
      setErrorMessage(null);
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleLoadSamples = useCallback(async () => {
    setIsLoadingSamples(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/samples");
      if (!res.ok) {
        throw new Error("Gagal mengambil daftar 10 CV contoh.");
      }
      const data = (await res.json()) as {
        samples: Array<{ name: string; url: string; sizeBytes: number }>;
      };
      setTotalBundledSamples(data.samples.length);
      setStagedFiles(
        data.samples.map((item) => ({
          id: `sample-${item.name}`,
          name: item.name,
          sizeBytes: item.sizeBytes,
          source: "sample",
          sampleUrl: item.url,
        })),
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar CV contoh.",
      );
    } finally {
      setIsLoadingSamples(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setStagedFiles([]);
    setReport(null);
    setSelectedCandidate(null);
    setInviteCandidate(null);
    setErrorMessage(null);
  }, []);

  const handleBackToUpload = useCallback(() => {
    setReport(null);
    setSelectedCandidate(null);
    setInviteCandidate(null);
    setErrorMessage(null);
  }, []);

  const handleStartScreening = useCallback(async () => {
    if (stagedFiles.length === 0 || isScreening) return;

    setIsScreening(true);
    setErrorMessage(null);
    setSelectedCandidate(null);
    setInviteCandidate(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.set("roleTitle", roleTitle.trim());
      formData.set("criteriaText", criteriaText.trim());
      formData.set("mustHaveText", mustHaveText.trim());

      const allFromSamples =
        stagedFiles.every((f) => f.source === "sample") &&
        stagedFiles.length === totalBundledSamples;

      if (allFromSamples) {
        formData.set("useSamples", "true");
      } else {
        for (const item of stagedFiles) {
          if (item.source === "upload" && item.file) {
            formData.append("files", item.file, item.name);
          } else if (item.source === "sample" && item.sampleUrl) {
            const sampleRes = await fetch(item.sampleUrl);
            if (!sampleRes.ok) {
              throw new Error(`Gagal memuat file contoh ${item.name}.`);
            }
            const blob = await sampleRes.blob();
            formData.append(
              "files",
              new File([blob], item.name, { type: "application/pdf" }),
              item.name,
            );
          }
        }
      }

      const res = await fetch("/api/screen", {
        method: "POST",
        body: formData,
      });

      let payload:
        | (BulkScreeningReport & { error?: string; failedFiles?: FailedFile[] })
        | null = null;
      try {
        payload = (await res.json()) as BulkScreeningReport & {
          error?: string;
          failedFiles?: FailedFile[];
        };
      } catch {
        throw new Error(
          res.status === 413
            ? "Total ukuran file terlalu besar untuk diproses dalam satu sesi. Kurangi jumlah atau ukuran PDF."
            : "Server melebihi batas waktu atau tidak mengembalikan respons JSON. Coba ulangi dengan jumlah CV lebih sedikit.",
        );
      }

      if (!res.ok) {
        const failedDetail =
          payload?.failedFiles && payload.failedFiles.length > 0
            ? ` (${payload.failedFiles
                .slice(0, 3)
                .map((f) => `${f.filename}: ${f.reason}`)
                .join("; ")})`
            : "";
        throw new Error(
          `${payload?.error || "Gagal memproses screening CV di server."}${failedDetail}`,
        );
      }

      setReport(payload);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses screening CV.",
      );
    } finally {
      setIsScreening(false);
    }
  }, [
    stagedFiles,
    isScreening,
    roleTitle,
    criteriaText,
    mustHaveText,
    totalBundledSamples,
  ]);

  const handleExportCsv = useCallback(() => {
    if (!report) return;
    const csv = resultsToCsv(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeCsvFilename(report.roleTitle);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [report]);

  const showResultsView = Boolean(report) && !isScreening;

  return (
    <div
      className={`min-h-screen text-slate-900 ${
        showResultsView ? "bg-white" : "bg-[#F3F5F8]"
      }`}
    >
      {showResultsView ? (
        <TopBar
          roleTitle={report?.roleTitle ?? roleTitle}
          isScreening={isScreening}
          onOpenCriteria={() => setCriteriaOpen(true)}
          onBackToUpload={handleBackToUpload}
        />
      ) : null}

      {errorMessage ? (
        <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-8">
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={1.75}
              />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Tutup pesan kesalahan"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-rose-700 hover:bg-rose-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      ) : null}

      {isScreening ? (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
          <div className="surface-card w-full rounded-2xl px-8 py-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Loader2 className="h-6 w-6 animate-spin" strokeWidth={2} />
            </div>
            <h2 className="mt-5 text-[17px] font-bold tracking-tight text-slate-900 tabular-nums">
              Menilai {stagedFiles.length || 10} CV...
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
              Membaca dokumen PDF dan menghitung skor kecocokan untuk posisi{" "}
              <span className="font-semibold text-slate-900">{roleTitle}</span>.
            </p>
          </div>
        </main>
      ) : !showResultsView ? (
        <UploadBar
          presets={ROLE_PRESETS}
          selectedPresetId={selectedPresetId}
          roleTitle={roleTitle}
          mustHaveText={mustHaveText}
          stagedFiles={stagedFiles}
          isLoadingSamples={isLoadingSamples}
          isScreening={isScreening}
          onSelectPreset={handleSelectPreset}
          onOpenCriteria={() => setCriteriaOpen(true)}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          onLoadSamples={handleLoadSamples}
          onReset={handleReset}
          onStartScreening={handleStartScreening}
        />
      ) : (
        <CandidatesTable
          report={report}
          isScreening={isScreening}
          stagedCount={stagedFiles.length}
          roleTitle={report?.roleTitle ?? roleTitle}
          selectedCandidateId={
            selectedCandidate
              ? selectedCandidate.id || selectedCandidate.filename
              : null
          }
          onSelectCandidate={(candidate) => setSelectedCandidate(candidate)}
          onInviteCandidate={(candidate) => setInviteCandidate(candidate)}
          onExportCsv={handleExportCsv}
        />
      )}

      <CriteriaDrawer
        open={criteriaOpen}
        presets={ROLE_PRESETS}
        selectedPresetId={selectedPresetId}
        roleTitle={roleTitle}
        criteriaText={criteriaText}
        mustHaveText={mustHaveText}
        showRunScreening={showResultsView && stagedFiles.length > 0}
        isScreening={isScreening}
        onSelectPreset={handleSelectPreset}
        onChangeRoleTitle={(val) => {
          setSelectedPresetId("custom");
          setRoleTitle(val);
        }}
        onChangeCriteriaText={(val) => {
          setSelectedPresetId("custom");
          setCriteriaText(val);
        }}
        onChangeMustHaveText={(val) => {
          setSelectedPresetId("custom");
          setMustHaveText(val);
        }}
        onStartScreening={handleStartScreening}
        onClose={() => setCriteriaOpen(false)}
      />

      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onInviteCandidate={(candidate) => setInviteCandidate(candidate)}
      />

      <InviteModal
        candidate={inviteCandidate}
        roleTitle={report?.roleTitle ?? roleTitle}
        companyName={companyName}
        onClose={() => setInviteCandidate(null)}
      />
    </div>
  );
}
