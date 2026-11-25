import { extractText } from "unpdf";
import type { CandidateDocument, FailedFile } from "./types";

const MIN_EXTRACTED_CHARS = 40;
const MAX_STORED_CHARS = 12_000;

function hasPdfHeader(bytes: Uint8Array): boolean {
  const probeLength = Math.min(bytes.length, 1024);
  if (probeLength < 5) return false;
  let ascii = "";
  for (let i = 0; i < probeLength; i += 1) {
    ascii += String.fromCharCode(bytes[i]);
  }
  return ascii.includes("%PDF-");
}

function disambiguateFilename(rawName: string, assigned: Set<string>): string {
  const cleanName = rawName.trim() || "CV.pdf";
  if (!assigned.has(cleanName.toLowerCase())) {
    assigned.add(cleanName.toLowerCase());
    return cleanName;
  }

  const dotIdx = cleanName.lastIndexOf(".");
  const stem = dotIdx > 0 ? cleanName.slice(0, dotIdx) : cleanName;
  const ext = dotIdx > 0 ? cleanName.slice(dotIdx) : "";

  let counter = 2;
  let candidate = `${stem} (${counter})${ext}`;
  while (assigned.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${stem} (${counter})${ext}`;
  }
  assigned.add(candidate.toLowerCase());
  return candidate;
}

export async function extractBulkPdfs(
  files: Array<{ name: string; bytes: Uint8Array }>,
): Promise<{ validDocs: CandidateDocument[]; failedFiles: FailedFile[] }> {
  const validDocs: CandidateDocument[] = [];
  const failedFiles: FailedFile[] = [];
  const assignedNames = new Set<string>();

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const filename = disambiguateFilename(file.name, assignedNames);

    if (!file.bytes || file.bytes.length === 0) {
      failedFiles.push({
        filename,
        reason: "File PDF kosong (0 byte).",
      });
      continue;
    }

    if (!hasPdfHeader(file.bytes)) {
      failedFiles.push({
        filename,
        reason: "File bukan dokumen PDF yang valid atau rusak.",
      });
      continue;
    }

    try {
      const result = await extractText(new Uint8Array(file.bytes), {
        mergePages: true,
      });
      const rawText = Array.isArray(result.text)
        ? result.text.join("\n")
        : result.text ?? "";
      const cleaned = rawText
        .replace(/\u0000/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (cleaned.length < MIN_EXTRACTED_CHARS) {
        failedFiles.push({
          filename,
          reason:
            "Teks CV tidak terbaca (kemungkinan PDF hasil scan gambar tanpa OCR).",
        });
        continue;
      }

      validDocs.push({
        id: `doc-${i + 1}`,
        filename,
        text: cleaned.slice(0, MAX_STORED_CHARS),
        pageCount: result.totalPages || 1,
      });
    } catch {
      failedFiles.push({
        filename,
        reason: "Gagal mengekstrak teks PDF (file terenkripsi atau rusak).",
      });
    }
  }

  return { validDocs, failedFiles };
}
