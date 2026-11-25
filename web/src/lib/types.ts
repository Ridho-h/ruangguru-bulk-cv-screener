import { z } from "zod";

export type MatchLevel = "High" | "Medium" | "Low";

export function classifyMatchLevel(score: number): MatchLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export const CandidateEvaluationSchema = z.object({
  candidateName: z.string(),
  location: z.string(),
  overallScore: z.number(),
  jobMatchScore: z.number(),
  experienceScore: z.number(),
  technicalSkillsScore: z.number(),
  recommended: z.boolean(),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  interviewFocusAreas: z.array(z.string()),
});

export type CandidateEvaluation = z.infer<typeof CandidateEvaluationSchema>;

export const CANDIDATE_EVALUATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    candidateName: {
      type: "string",
      description: "Nama lengkap kandidat sesuai isi CV (bukan nama file PDF).",
    },
    location: {
      type: "string",
      description:
        "Kota atau wilayah domisili kandidat (isi 'Tidak tercantum' jika tidak ada di CV).",
    },
    overallScore: {
      type: "integer",
      description: "Skor keseluruhan kandidat 0 sampai 100.",
    },
    jobMatchScore: {
      type: "integer",
      description: "Skor kecocokan terhadap posisi dan tanggung jawab 0 sampai 100.",
    },
    experienceScore: {
      type: "integer",
      description: "Skor relevansi pengalaman kerja atau proyek 0 sampai 100.",
    },
    technicalSkillsScore: {
      type: "integer",
      description: "Skor kesesuaian keterampilan teknis terhadap syarat wajib 0 sampai 100.",
    },
    recommended: {
      type: "boolean",
      description: "True jika kandidat layak lanjut ke tahap wawancara.",
    },
    summary: {
      type: "string",
      description:
        "Ringkasan objektif 2-3 kalimat dalam Bahasa Indonesia tanpa bahasa promosi.",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "2 sampai 4 kelebihan utama kandidat berdasarkan bukti di CV.",
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      description: "1 sampai 3 celah atau hal yang masih perlu diverifikasi.",
    },
    interviewFocusAreas: {
      type: "array",
      items: { type: "string" },
      description: "Tepat 3 fokus pertanyaan konkret untuk tahap wawancara.",
    },
  },
  required: [
    "candidateName",
    "location",
    "overallScore",
    "jobMatchScore",
    "experienceScore",
    "technicalSkillsScore",
    "recommended",
    "summary",
    "strengths",
    "gaps",
    "interviewFocusAreas",
  ],
} as const;

export interface CandidateDocument {
  id: string;
  filename: string;
  text: string;
  pageCount: number;
}

export interface ScreenedCandidate extends CandidateEvaluation {
  id: string;
  filename: string;
  ragScore: number;
  matchLevel: MatchLevel;
  stage: "Screening";
  modelUsed: string;
}

export interface FailedFile {
  filename: string;
  reason: string;
}

export interface BulkScreeningReport {
  roleTitle: string;
  totalSubmitted: number;
  totalScreened: number;
  recommendedCount: number;
  durationMs: number;
  modelUsed: string;
  fallbackCount: number;
  candidates: ScreenedCandidate[];
  failedFiles: FailedFile[];
}

export interface RolePreset {
  id: string;
  roleTitle: string;
  criteriaText: string;
  mustHaveText: string;
  companyName: string;
}
