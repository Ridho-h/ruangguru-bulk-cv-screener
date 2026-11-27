import { computeRagScores, type EmbedClientLike } from "./rag";
import {
  CANDIDATE_EVALUATION_JSON_SCHEMA,
  CandidateEvaluationSchema,
  classifyMatchLevel,
  type BulkScreeningReport,
  type CandidateDocument,
  type CandidateEvaluation,
  type FailedFile,
  type ScreenedCandidate,
} from "./types";

export const DEFAULT_REASONING_MODEL = "gemini-3.5-flash-lite";
export const FALLBACK_REASONING_MODELS = ["gemini-3.1-flash-lite"] as const;
export const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
export const DEFAULT_CONCURRENCY = 4;
export const DEFAULT_TIMEOUT_MS = 30_000;

export interface InteractionOutputLike {
  output_text?: string;
  outputs?: Array<{ type?: string; text?: string }>;
  steps?: Array<{
    outputs?: Array<{ type?: string; text?: string }>;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

export interface GenAIClientLike extends EmbedClientLike {
  interactions: {
    create(
      params: {
        model: string;
        input: string;
        system_instruction?: string;
        response_format?: {
          type: "text";
          mime_type: "application/json";
          schema: Record<string, unknown>;
        };
        generation_config?: {
          temperature?: number;
        };
      },
      options?: {
        timeout_ms?: number;
        retries?: { strategy: "none" };
        fetch_options?: { signal?: AbortSignal };
      },
    ): Promise<InteractionOutputLike>;
  };
}

const ROLE_SUFFIX_PATTERNS = [
  /\b(junior|senior|lead|staff|intern)\b/gi,
  /\b(ai|ml|machine learning|data|backend|frontend|fullstack|full stack|software|web|mobile)\b/gi,
  /\b(engineer|scientist|analyst|developer|specialist|admin|operasional|cv|resume)\b/gi,
];

function cleanNameFromFilename(filename: string): string {
  let stem = filename
    .replace(/\.pdf$/i, "")
    .replace(/\(\d+\)\s*$/, "")
    .replace(/^\d+[\s_-]*/, "")
    .replace(/[_-]+/g, " ")
    .trim();

  for (const pattern of ROLE_SUFFIX_PATTERNS) {
    stem = stem.replace(pattern, " ");
  }

  const collapsed = stem.replace(/\s+/g, " ").trim();
  if (!collapsed) return "Kandidat Tanpa Nama";

  return collapsed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

const DEFAULT_INTERVIEW_FOCUS = [
  "Verifikasi kontribusi nyata pada proyek utama yang tercantum di CV.",
  "Uji pemahaman teknis terhadap syarat wajib posisi melalui studi kasus singkat.",
  "Konfirmasi kesiapan kolaborasi tim, ekspektasi peran, dan ketersediaan mulai kerja.",
];

export function normalizeEvaluation(
  ev: CandidateEvaluation,
  filename: string,
): CandidateEvaluation {
  const rawName = (ev.candidateName ?? "").trim();
  const looksLikeFilename =
    !rawName ||
    /\.pdf$/i.test(rawName) ||
    /^\d+[_-]/.test(rawName) ||
    rawName.includes("_");

  const candidateName = looksLikeFilename
    ? cleanNameFromFilename(rawName || filename)
    : rawName;

  const location = (ev.location ?? "").trim() || "Tidak tercantum";
  const overallScore = clampScore(ev.overallScore);
  const jobMatchScore = clampScore(ev.jobMatchScore);
  const experienceScore = clampScore(ev.experienceScore);
  const technicalSkillsScore = clampScore(ev.technicalSkillsScore);

  const summary =
    (ev.summary ?? "").trim() ||
    "Ringkasan kandidat dihasilkan berdasarkan kecocokan pengalaman dan keterampilan di CV.";

  const strengths = (ev.strengths ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (strengths.length === 0) {
    strengths.push("Memiliki latar belakang dasar yang dapat digali lebih lanjut.");
  }

  const gaps = (ev.gaps ?? [])
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (gaps.length === 0) {
    gaps.push("Perlu konfirmasi kedalaman pengalaman teknis pada sesi wawancara.");
  }

  const focusAreas = (ev.interviewFocusAreas ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  let fallbackIdx = 0;
  while (focusAreas.length < 3) {
    focusAreas.push(DEFAULT_INTERVIEW_FOCUS[fallbackIdx]);
    fallbackIdx += 1;
  }

  return {
    candidateName,
    location,
    overallScore,
    jobMatchScore,
    experienceScore,
    technicalSkillsScore,
    recommended: classifyMatchLevel(overallScore) === "High",
    summary,
    strengths,
    gaps,
    interviewFocusAreas: focusAreas,
  };
}

function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const errorObj = err as {
    name?: string;
    status?: number;
    statusCode?: number;
    message?: string;
  };
  const name = (errorObj.name ?? "").toLowerCase();
  const message = (errorObj.message ?? "").toLowerCase();
  const status = errorObj.status ?? errorObj.statusCode;

  if (
    name === "aborterror" ||
    name === "timeouterror" ||
    name === "apiuseraborterror" ||
    name === "apiconnectionerror" ||
    name === "apiconnectiontimeouterror" ||
    name === "continuationtimeouterror"
  ) {
    return true;
  }
  if (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("service_unavailable") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("aborted") ||
    message.includes("unable to make request") ||
    message.includes("econnreset") ||
    message.includes("etimedout")
  );
}

function formatCandidateErrorIndonesian(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "Evaluasi CV gagal diproses oleh layanan AI.";
  }
  const errorObj = err as {
    name?: string;
    status?: number;
    statusCode?: number;
    message?: string;
  };
  const name = (errorObj.name ?? "").toLowerCase();
  const message = (errorObj.message ?? "").toLowerCase();
  const status = errorObj.status ?? errorObj.statusCode;

  if (status === 401 || status === 403 || message.includes("api key") || message.includes("permission")) {
    return "Autentikasi GEMINI_API_KEY ditolak. Periksa API key di konfigurasi server.";
  }
  if (status === 429 || message.includes("429") || message.includes("rate limit") || message.includes("resource_exhausted")) {
    return "Batas kuota permintaan Gemini API tercapai. Coba lagi beberapa saat.";
  }
  if (
    name === "timeouterror" ||
    name === "aborterror" ||
    name === "apiuseraborterror" ||
    name === "apiconnectiontimeouterror" ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return "Permintaan evaluasi melebihi batas waktu (30 detik).";
  }
  if (status === 503 || message.includes("503") || message.includes("unavailable") || message.includes("overloaded")) {
    return "Layanan model Gemini sedang padat. Coba ulangi beberapa saat lagi.";
  }
  return "Evaluasi CV gagal diproses. Silakan coba ulangi screening.";
}

function extractInteractionText(response: InteractionOutputLike): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  if (Array.isArray(response.outputs)) {
    const joined = response.outputs
      .filter((part) => typeof part?.text === "string")
      .map((part) => part.text as string)
      .join("\n")
      .trim();
    if (joined) return joined;
  }
  if (Array.isArray(response.steps)) {
    const parts: string[] = [];
    for (const step of response.steps) {
      for (const item of [...(step.outputs ?? []), ...(step.content ?? [])]) {
        if (typeof item?.text === "string") parts.push(item.text);
      }
    }
    const joined = parts.join("\n").trim();
    if (joined) return joined;
  }
  throw new Error("Respons model tidak berisi teks JSON.");
}

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

async function runWithTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          const err = new Error(`Permintaan melebihi batas waktu (${timeoutMs} ms) — timed out.`);
          err.name = "TimeoutError";
          reject(err);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const SYSTEM_INSTRUCTION =
  "Anda adalah Senior Technical Recruiter di Indonesia yang objektif, ketat, dan berbasis bukti CV. " +
  "Evaluasi kandidat apa adanya tanpa melebih-lebihkan. Gunakan Bahasa Indonesia yang lugas, profesional, " +
  "tanpa emoji, dan tanpa bahasa pemasaran. Selalu kembalikan tepat 3 poin pada interviewFocusAreas.";

function buildEvaluationPrompt(params: {
  roleTitle: string;
  criteriaText: string;
  mustHaveText: string;
  ragScore: number;
  doc: CandidateDocument;
}): string {
  return [
    `Posisi: ${params.roleTitle}`,
    `Kriteria Utama:\n${params.criteriaText}`,
    `Syarat Wajib (Must-Have):\n${params.mustHaveText || "-"}`,
    `Skor Kemiripan Semantik Awal (RAG): ${params.ragScore}/100`,
    "",
    "Panduan Penilaian:",
    "- overallScore >= 75: sangat relevan (High), 50-74: relevan sebagian (Medium), < 50: kurang sesuai (Low).",
    "- Tetapkan recommended = true HANYA jika overallScore >= 75 (kecocokan Tinggi).",
    "- Ekstrak nama asli kandidat dari isi CV (jangan pakai nama file PDF).",
    "- Kembalikan tepat 3 fokus pertanyaan konkret di interviewFocusAreas.",
    "",
    `Nama File: ${params.doc.filename}`,
    "Isi Teks CV:",
    params.doc.text,
  ].join("\n");
}

async function evaluateSingleCandidate(params: {
  client: GenAIClientLike;
  doc: CandidateDocument;
  roleTitle: string;
  criteriaText: string;
  mustHaveText: string;
  ragScore: number;
  modelsToTry: string[];
  timeoutMs: number;
}): Promise<{ candidate: ScreenedCandidate; usedFallback: boolean }> {
  const prompt = buildEvaluationPrompt({
    roleTitle: params.roleTitle,
    criteriaText: params.criteriaText,
    mustHaveText: params.mustHaveText,
    ragScore: params.ragScore,
    doc: params.doc,
  });

  let lastError: unknown;
  for (let idx = 0; idx < params.modelsToTry.length; idx += 1) {
    const model = params.modelsToTry[idx];
    try {
      const response = await runWithTimeout(
        (signal) =>
          params.client.interactions.create(
            {
              model,
              input: prompt,
              system_instruction: SYSTEM_INSTRUCTION,
              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: CANDIDATE_EVALUATION_JSON_SCHEMA as unknown as Record<
                  string,
                  unknown
                >,
              },
              generation_config: {
                temperature: 0.1,
              },
            },
            {
              timeout_ms: params.timeoutMs,
              retries: { strategy: "none" },
              fetch_options: { signal },
            },
          ),
        params.timeoutMs,
      );

      const rawText = stripJsonFence(extractInteractionText(response));
      const parsed = CandidateEvaluationSchema.parse(JSON.parse(rawText));
      const normalized = normalizeEvaluation(parsed, params.doc.filename);

      return {
        candidate: {
          ...normalized,
          id: params.doc.id,
          filename: params.doc.filename,
          ragScore: params.ragScore,
          matchLevel: classifyMatchLevel(normalized.overallScore),
          stage: "Screening",
          modelUsed: model,
        },
        usedFallback: idx > 0,
      };
    } catch (err) {
      lastError = err;
      const hasNextModel = idx < params.modelsToTry.length - 1;
      if (hasNextModel && isTransientError(err)) {
        continue;
      }
      break;
    }
  }

  throw new Error(formatCandidateErrorIndonesian(lastError));
}

export interface ScreenCandidatesOptions {
  client: GenAIClientLike;
  roleTitle: string;
  criteriaText: string;
  mustHaveText?: string;
  docs: CandidateDocument[];
  initialFailedFiles?: FailedFile[];
  reasoningModel?: string;
  fallbackModels?: readonly string[];
  embeddingModel?: string;
  concurrency?: number;
  timeoutMs?: number;
}

export async function screenCandidates(
  options: ScreenCandidatesOptions,
): Promise<BulkScreeningReport> {
  const startedAt = Date.now();
  const primaryModel = options.reasoningModel ?? DEFAULT_REASONING_MODEL;
  const fallbacks = options.fallbackModels ?? FALLBACK_REASONING_MODELS;
  const modelsToTry = [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)];
  const embeddingModel = options.embeddingModel ?? DEFAULT_EMBEDDING_MODEL;
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const mustHaveText = options.mustHaveText?.trim() ?? "";

  const failedFiles: FailedFile[] = [...(options.initialFailedFiles ?? [])];
  const candidates: ScreenedCandidate[] = [];
  let fallbackCount = 0;

  let ragScores = new Map<string, number>();
  if (options.docs.length > 0) {
    try {
      const queryText = `${options.roleTitle}\n${options.criteriaText}\n${mustHaveText}`;
      ragScores = await computeRagScores(
        options.client,
        queryText,
        options.docs,
        embeddingModel,
      );
    } catch {
      ragScores = new Map<string, number>();
    }
  }

  let cursor = 0;
  async function worker() {
    while (cursor < options.docs.length) {
      const doc = options.docs[cursor];
      cursor += 1;
      try {
        const { candidate, usedFallback } = await evaluateSingleCandidate({
          client: options.client,
          doc,
          roleTitle: options.roleTitle,
          criteriaText: options.criteriaText,
          mustHaveText,
          ragScore: ragScores.get(doc.filename) ?? 0,
          modelsToTry,
          timeoutMs,
        });
        candidates.push(candidate);
        if (usedFallback) fallbackCount += 1;
      } catch (err) {
        failedFiles.push({
          filename: doc.filename,
          reason:
            err instanceof Error
              ? err.message
              : "Evaluasi kandidat gagal diproses.",
        });
      }
    }
  }

  const workerCount = Math.min(concurrency, Math.max(1, options.docs.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  candidates.sort((a, b) => {
    if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
    if (b.ragScore !== a.ragScore) return b.ragScore - a.ragScore;
    return a.candidateName.localeCompare(b.candidateName, "id");
  });

  const recommendedCount = candidates.filter((c) => c.recommended).length;
  const totalSubmitted = options.docs.length + (options.initialFailedFiles?.length ?? 0);

  return {
    roleTitle: options.roleTitle,
    totalSubmitted,
    totalScreened: candidates.length,
    recommendedCount,
    durationMs: Date.now() - startedAt,
    modelUsed: primaryModel,
    fallbackCount,
    candidates,
    failedFiles,
  };
}
