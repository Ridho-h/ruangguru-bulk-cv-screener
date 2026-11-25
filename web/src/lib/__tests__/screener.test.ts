import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { classifyMatchLevel, type BulkScreeningReport } from "../types";
import { ROLE_PRESETS } from "../presets";
import { extractBulkPdfs } from "../pdf-extract";
import { computeRagScores, cosineSimilarity } from "../rag";
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_REASONING_MODEL,
  FALLBACK_REASONING_MODELS,
  normalizeEvaluation,
  screenCandidates,
  type GenAIClientLike,
} from "../screener";
import {
  generateInterviewInvite,
  resultsToCsv,
  safeCsvFilename,
} from "../export";

const SAMPLE_DIR = path.resolve(process.cwd(), "public/sample-cvs");

describe("types & presets", () => {
  it("classifies match levels deterministically", () => {
    expect(classifyMatchLevel(100)).toBe("High");
    expect(classifyMatchLevel(75)).toBe("High");
    expect(classifyMatchLevel(74)).toBe("Medium");
    expect(classifyMatchLevel(50)).toBe("Medium");
    expect(classifyMatchLevel(49)).toBe("Low");
    expect(classifyMatchLevel(0)).toBe("Low");
  });

  it("exposes 3 Indonesian role presets", () => {
    expect(ROLE_PRESETS).toHaveLength(3);
    expect(ROLE_PRESETS.map((p) => p.roleTitle)).toEqual([
      "Junior AI Engineer",
      "Data Scientist / ML Engineer",
      "AI Automation Specialist",
    ]);
  });
});

describe("extractBulkPdfs (Review Focus #1)", () => {
  it("extracts valid sample PDFs, isolates corrupt/empty files, and disambiguates duplicate names", async () => {
    const nadiaBytes = new Uint8Array(
      fs.readFileSync(path.join(SAMPLE_DIR, "01_Nadia_Kusuma_AI_Engineer.pdf")),
    );
    const corruptBytes = new TextEncoder().encode("not a real pdf document");
    const emptyBytes = new Uint8Array(0);

    const { validDocs, failedFiles } = await extractBulkPdfs([
      { name: "01_Nadia_Kusuma_AI_Engineer (2).pdf", bytes: nadiaBytes },
      { name: "01_Nadia_Kusuma_AI_Engineer.pdf", bytes: nadiaBytes },
      { name: "01_Nadia_Kusuma_AI_Engineer.pdf", bytes: nadiaBytes },
      { name: "rusak.pdf", bytes: corruptBytes },
      { name: "kosong.pdf", bytes: emptyBytes },
    ]);

    expect(validDocs).toHaveLength(3);
    expect(validDocs.map((d) => d.filename)).toEqual([
      "01_Nadia_Kusuma_AI_Engineer (2).pdf",
      "01_Nadia_Kusuma_AI_Engineer.pdf",
      "01_Nadia_Kusuma_AI_Engineer (3).pdf",
    ]);
    expect(validDocs[0].text.length).toBeGreaterThan(100);
    expect(failedFiles).toHaveLength(2);
    expect(failedFiles.map((f) => f.filename).sort()).toEqual([
      "kosong.pdf",
      "rusak.pdf",
    ]);
  });
});

describe("RAG embeddings & cosine similarity", () => {
  it("computes cosine similarity accurately including zero vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it("batches embedContent calls to <= 80 items per request", async () => {
    const embedCalls: number[] = [];
    const mockClient: GenAIClientLike = {
      models: {
        embedContent: vi.fn(async (params: { contents: string[] }) => {
          embedCalls.push(params.contents.length);
          return {
            embeddings: params.contents.map((_, idx) => ({
              values: [1, idx === 0 ? 1 : 0.5],
            })),
          };
        }),
      },
      interactions: {
        create: vi.fn(),
      },
    };

    const docs = Array.from({ length: 90 }, (_, i) => ({
      id: `doc-${i}`,
      filename: `cv-${i}.pdf`,
      text: `Kandidat ${i} dengan pengalaman Python dan RAG`,
      pageCount: 1,
    }));

    const scores = await computeRagScores(
      mockClient,
      "Junior AI Engineer Python RAG",
      docs,
      DEFAULT_EMBEDDING_MODEL,
    );

    expect(embedCalls.every((count) => count <= 80)).toBe(true);
    expect(embedCalls.reduce((a, b) => a + b, 0)).toBe(91); // 1 query + 90 docs
    expect(scores.size).toBe(90);
  });
});

describe("normalizeEvaluation (Review Focus #3)", () => {
  it("cleans numeric prefixes & .pdf names, fills missing location, and ensures 3 interview focus areas", () => {
    const normalized = normalizeEvaluation(
      {
        candidateName: "01_Nadia_Kusuma_AI_Engineer.pdf",
        location: "   ",
        overallScore: 108,
        jobMatchScore: 88,
        experienceScore: -4,
        technicalSkillsScore: 84,
        recommended: true,
        summary: "Kandidat relevan dengan proyek RAG.",
        strengths: ["Python", "RAG"],
        gaps: ["Belum ada pengalaman Kubernetes"],
        interviewFocusAreas: ["Tanyakan arsitektur RAG"],
      },
      "01_Nadia_Kusuma_AI_Engineer.pdf",
    );

    expect(normalized.candidateName).toBe("Nadia Kusuma");
    expect(normalized.location).toBe("Tidak tercantum");
    expect(normalized.overallScore).toBe(100);
    expect(normalized.experienceScore).toBe(0);
    expect(normalized.interviewFocusAreas).toHaveLength(3);

    const fromEmptyName = normalizeEvaluation(
      {
        candidateName: "",
        location: "Bandung",
        overallScore: 70,
        jobMatchScore: 70,
        experienceScore: 70,
        technicalSkillsScore: 70,
        recommended: true,
        summary: "Baik.",
        strengths: ["Python"],
        gaps: ["Docker"],
        interviewFocusAreas: ["1", "2", "3"],
      },
      "02_Rizky_Mahendra_ML_Engineer.pdf",
    );
    expect(fromEmptyName.candidateName).toBe("Rizky Mahendra");
  });
});

describe("screenCandidates fallback & isolation (Review Focus #2)", () => {
  it("uses gemini-3.5-flash-lite primary, falls back to gemini-3.1-flash-lite on 503/timeout, and isolates single-candidate failures", async () => {
    expect(DEFAULT_REASONING_MODEL).toBe("gemini-3.5-flash-lite");
    expect(FALLBACK_REASONING_MODELS).toEqual(["gemini-3.1-flash-lite"]);

    const mockClient: GenAIClientLike = {
      models: {
        embedContent: vi.fn(async (params: { contents: string[] }) => ({
          embeddings: params.contents.map((_, idx) => ({
            values: [1, idx === 1 ? 0.9 : 0.4],
          })),
        })),
      },
      interactions: {
        create: vi.fn(async (params: { model: string; input: string }) => {
          if (params.input.includes("CV_CANDIDATE_2")) {
            if (params.model === "gemini-3.5-flash-lite") {
              const err = new Error("503 Service Unavailable: high demand");
              throw err;
            }
            return {
              output_text: JSON.stringify({
                candidateName: "Rizky Mahendra",
                location: "Bandung",
                overallScore: 82,
                jobMatchScore: 80,
                experienceScore: 78,
                technicalSkillsScore: 85,
                recommended: true,
                summary: "Pengalaman ML production sangat baik.",
                strengths: ["PyTorch", "MLOps"],
                gaps: ["Minim LLM agent"],
                interviewFocusAreas: [
                  "Eksplorasi pipeline deployment model",
                  "Diskusi optimasi inferensi",
                  "Tanyakan studi kasus evaluasi model",
                ],
              }),
            };
          }

          if (params.input.includes("CV_CANDIDATE_3")) {
            const timeoutErr = new Error("The operation timed out");
            timeoutErr.name = "TimeoutError";
            throw timeoutErr;
          }

          return {
            output_text: JSON.stringify({
              candidateName: "Nadia Kusuma",
              location: "Jakarta",
              overallScore: 91,
              jobMatchScore: 92,
              experienceScore: 86,
              technicalSkillsScore: 93,
              recommended: true,
              summary: "Sangat cocok untuk Junior AI Engineer.",
              strengths: ["Python", "RAG", "FastAPI"],
              gaps: ["Pengalaman tim skala besar"],
              interviewFocusAreas: [
                "Bedah arsitektur RAG",
                "Uji debugging prompt & evaluasi",
                "Diskusi kolaborasi engineering",
              ],
            }),
          };
        }),
      },
    };

    const report = await screenCandidates({
      client: mockClient,
      roleTitle: "Junior AI Engineer",
      criteriaText: "Menguasai Python, LLM, RAG, dan API backend.",
      mustHaveText: "Python, REST API",
      docs: [
        {
          id: "1",
          filename: "01_Nadia.pdf",
          text: "CV_CANDIDATE_1 Nadia Kusuma Jakarta Python RAG FastAPI",
          pageCount: 1,
        },
        {
          id: "2",
          filename: "02_Rizky.pdf",
          text: "CV_CANDIDATE_2 Rizky Mahendra Bandung PyTorch MLOps",
          pageCount: 1,
        },
        {
          id: "3",
          filename: "03_Timeout.pdf",
          text: "CV_CANDIDATE_3 Fajar Timeout",
          pageCount: 1,
        },
      ],
      initialFailedFiles: [],
      timeoutMs: 5000,
    });

    expect(report.totalSubmitted).toBe(3);
    expect(report.totalScreened).toBe(2);
    expect(report.recommendedCount).toBe(2);
    expect(report.fallbackCount).toBe(1);
    expect(report.candidates.map((c) => c.candidateName)).toEqual([
      "Nadia Kusuma",
      "Rizky Mahendra",
    ]);
    expect(report.candidates[1].modelUsed).toBe("gemini-3.1-flash-lite");
    expect(report.failedFiles).toHaveLength(1);
    expect(report.failedFiles[0].filename).toBe("03_Timeout.pdf");
    expect(report.failedFiles[0].reason).toContain("batas waktu");
  });

  it("triggers fallback on SDK-wrapped APIUserAbortError and APIConnectionError", async () => {
    const mockClient: GenAIClientLike = {
      models: {
        embedContent: vi.fn(async () => ({
          embeddings: [{ values: [1, 0] }, { values: [1, 0] }],
        })),
      },
      interactions: {
        create: vi.fn(async (params: { model: string }) => {
          if (params.model === "gemini-3.5-flash-lite") {
            const err = new Error("Unable to make request");
            err.name = "APIConnectionError";
            throw err;
          }
          return {
            output_text: JSON.stringify({
              candidateName: "Dimas Pratama",
              location: "Yogyakarta",
              overallScore: 72,
              jobMatchScore: 70,
              experienceScore: 74,
              technicalSkillsScore: 72,
              recommended: true,
              summary: "Pengalaman Python backend kuat.",
              strengths: ["FastAPI"],
              gaps: ["RAG"],
              interviewFocusAreas: ["Fokus 1", "Fokus 2", "Fokus 3"],
            }),
          };
        }),
      },
    };

    const report = await screenCandidates({
      client: mockClient,
      roleTitle: "Junior AI Engineer",
      criteriaText: "Menguasai Python dan FastAPI.",
      docs: [
        {
          id: "doc-1",
          filename: "03_Dimas.pdf",
          text: "Dimas Pratama Yogyakarta Python FastAPI",
          pageCount: 1,
        },
      ],
    });

    expect(report.totalScreened).toBe(1);
    expect(report.fallbackCount).toBe(1);
    expect(report.candidates[0].modelUsed).toBe("gemini-3.1-flash-lite");
    expect(report.candidates[0].id).toBe("doc-1");
  });
});

describe("export.ts CSV safety & invite text (Review Focus #4)", () => {
  it("sanitizes unsafe role characters in CSV filename", () => {
    expect(safeCsvFilename("Data Scientist / ML Engineer")).toBe(
      "hasil-screening-data-scientist-ml-engineer.csv",
    );
    expect(safeCsvFilename("   ")).toBe("hasil-screening-kandidat.csv");
  });

  it("writes UTF-8 BOM and protects against Excel formula injection", () => {
    const report: BulkScreeningReport = {
      roleTitle: "Data Scientist / ML Engineer",
      totalSubmitted: 1,
      totalScreened: 1,
      recommendedCount: 1,
      durationMs: 1200,
      modelUsed: "gemini-3.5-flash-lite",
      fallbackCount: 0,
      failedFiles: [],
      candidates: [
        {
          id: "evil-1",
          filename: "evil.pdf",
          candidateName: "=HYPERLINK(\"http://evil\",\"Klik\")",
          location: "+62 Jakarta",
          overallScore: 85,
          jobMatchScore: 86,
          experienceScore: 80,
          technicalSkillsScore: 88,
          ragScore: 81,
          matchLevel: "High",
          stage: "Screening",
          recommended: true,
          summary: "-Ringkasan berbahaya",
          strengths: ["@Python"],
          gaps: ["Tidak ada"],
          interviewFocusAreas: ["Fokus 1", "Fokus 2", "Fokus 3"],
          modelUsed: "gemini-3.5-flash-lite",
        },
      ],
    };

    const csv = resultsToCsv(report);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\"'=HYPERLINK");
    expect(csv).toContain("'+62 Jakarta");
    expect(csv).toContain("'-Ringkasan berbahaya");
    expect(csv).toContain("'@Python");
  });

  it("generates plain Indonesian interview invite without raw markdown bold markers", () => {
    const text = generateInterviewInvite(
      {
        id: "nadia-1",
        filename: "01_Nadia.pdf",
        candidateName: "Nadia Kusuma",
        location: "Jakarta",
        overallScore: 90,
        jobMatchScore: 91,
        experienceScore: 86,
        technicalSkillsScore: 92,
        ragScore: 88,
        matchLevel: "High",
        stage: "Screening",
        recommended: true,
        summary: "Cocok untuk Junior AI Engineer.",
        strengths: ["Python", "RAG"],
        gaps: ["Docker"],
        interviewFocusAreas: [
          "Arsitektur RAG",
          "Evaluasi LLM",
          "Kolaborasi Git",
        ],
        modelUsed: "gemini-3.5-flash-lite",
      },
      "Junior AI Engineer",
      "Ruangguru",
    );

    expect(text).toContain("Nadia Kusuma");
    expect(text).toContain("Junior AI Engineer");
    expect(text).toContain("Ruangguru");
    expect(text).toContain("Arsitektur RAG");
    expect(text).not.toContain("**");
  });
});
