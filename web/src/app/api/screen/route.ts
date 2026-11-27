import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { extractBulkPdfs } from "@/lib/pdf-extract";
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_REASONING_MODEL,
  FALLBACK_REASONING_MODELS,
  screenCandidates,
  type GenAIClientLike,
  type InteractionOutputLike,
} from "@/lib/screener";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 30;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function createServerGenAIClient(apiKey: string): GenAIClientLike {
  const ai = new GoogleGenAI({ apiKey });

  return {
    models: {
      embedContent: async ({ model, contents }) => {
        const res = await ai.models.embedContent({ model, contents });
        return {
          embeddings: res.embeddings?.map((item) => ({
            values: item.values,
          })),
        };
      },
    },
    interactions: {
      create: async (params, options) => {
        const res = await ai.interactions.create(
          {
            model: params.model,
            input: params.input,
            system_instruction: params.system_instruction,
            response_format: params.response_format,
            generation_config: params.generation_config,
          },
          {
            timeout_ms: options?.timeout_ms,
            retries: options?.retries ?? { strategy: "none" },
            fetch_options: options?.fetch_options,
          },
        );
        return res as unknown as InteractionOutputLike;
      },
    },
  };
}

function loadBundledSamplePdfs(): Array<{ name: string; bytes: Uint8Array }> {
  const sampleDir = path.join(process.cwd(), "public", "sample-cvs");
  if (!fs.existsSync(sampleDir)) return [];

  return fs
    .readdirSync(sampleDir)
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      bytes: new Uint8Array(fs.readFileSync(path.join(sampleDir, name))),
    }));
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json(
      {
        error:
          "Konfigurasi GEMINI_API_KEY di server belum diisi. Tambahkan GEMINI_API_KEY pada file .env.local atau Environment Variables Vercel.",
      },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid. Kirim data menggunakan multipart/form-data." },
      { status: 400 },
    );
  }

  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const criteriaText = String(formData.get("criteriaText") ?? "").trim();
  const mustHaveText = String(formData.get("mustHaveText") ?? "").trim();
  const useSamples = String(formData.get("useSamples") ?? "").toLowerCase() === "true";

  if (roleTitle.length < 2) {
    return NextResponse.json(
      { error: "Nama posisi wajib diisi minimal 2 karakter." },
      { status: 400 },
    );
  }

  if (criteriaText.length < 10) {
    return NextResponse.json(
      {
        error:
          "Kriteria penilaian terlalu singkat. Isi minimal 10 karakter agar hasil screening akurat.",
      },
      { status: 400 },
    );
  }

  let rawFiles: Array<{ name: string; bytes: Uint8Array }> = [];

  if (useSamples) {
    rawFiles = loadBundledSamplePdfs();
    if (rawFiles.length === 0) {
      return NextResponse.json(
        { error: "File CV contoh tidak ditemukan di server." },
        { status: 500 },
      );
    }
  } else {
    const uploadedEntries = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (uploadedEntries.length === 0) {
      return NextResponse.json(
        { error: "Unggah minimal 1 file CV berformat PDF atau muat 10 CV contoh." },
        { status: 400 },
      );
    }

    if (uploadedEntries.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_FILES} file CV PDF dalam satu sesi screening.` },
        { status: 400 },
      );
    }

    for (const file of uploadedEntries) {
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".pdf")) {
        return NextResponse.json(
          {
            error: `Format file tidak didukung (${file.name}). Unggah hanya dokumen PDF (.pdf).`,
          },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Ukuran file ${file.name} melebihi batas 10 MB per file.`,
          },
          { status: 400 },
        );
      }
    }

    rawFiles = await Promise.all(
      uploadedEntries.map(async (file) => ({
        name: file.name,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })),
    );
  }

  try {
    const { validDocs, failedFiles } = await extractBulkPdfs(rawFiles);
    if (validDocs.length === 0) {
      return NextResponse.json(
        {
          error:
            "Tidak ada teks CV yang dapat dibaca dari file yang diunggah. Pastikan PDF bukan hasil scan gambar tanpa teks.",
          failedFiles,
        },
        { status: 400 },
      );
    }

    const client = createServerGenAIClient(apiKey);
    const report = await screenCandidates({
      client,
      roleTitle,
      criteriaText,
      mustHaveText,
      docs: validDocs,
      initialFailedFiles: failedFiles,
      reasoningModel: DEFAULT_REASONING_MODEL,
      fallbackModels: FALLBACK_REASONING_MODELS,
      embeddingModel: DEFAULT_EMBEDDING_MODEL,
    });

    if (report.candidates.length === 0 && report.failedFiles.length > 0) {
      return NextResponse.json(
        {
          error:
            report.failedFiles[0]?.reason ||
            "Seluruh CV gagal dievaluasi oleh layanan AI.",
          failedFiles: report.failedFiles,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(report, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Terjadi gangguan saat memproses screening di server. Coba ulangi beberapa saat lagi.",
      },
      { status: 500 },
    );
  }
}
