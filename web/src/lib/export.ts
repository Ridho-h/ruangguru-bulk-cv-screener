import type { BulkScreeningReport, ScreenedCandidate } from "./types";

export function safeCsvFilename(roleTitle: string): string {
  const slug = roleTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `hasil-screening-${slug || "kandidat"}.csv`;
}

function escapeCsvCell(value: string | number | boolean): string {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function resultsToCsv(report: BulkScreeningReport): string {
  const headers = [
    "Peringkat",
    "Nama Kandidat",
    "File CV",
    "Tahap",
    "Lokasi",
    "Match",
    "Overall Score",
    "Job Match",
    "Experience",
    "Technical Skills",
    "RAG Score",
    "Recommended",
    "Ringkasan",
    "Kelebihan Utama",
    "Celah & Catatan",
    "Interview Focus Areas",
    "Model",
  ];

  const rows = report.candidates.map((c, idx) =>
    [
      idx + 1,
      c.candidateName,
      c.filename,
      c.stage,
      c.location,
      c.matchLevel,
      c.overallScore,
      c.jobMatchScore,
      c.experienceScore,
      c.technicalSkillsScore,
      c.ragScore,
      c.recommended ? "Ya" : "Tidak",
      c.summary,
      c.strengths.join("; "),
      c.gaps.join("; "),
      c.interviewFocusAreas.join("; "),
      c.modelUsed,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return `\uFEFF${[headers.map(escapeCsvCell).join(","), ...rows].join("\r\n")}`;
}

export function generateInterviewInvite(
  candidate: ScreenedCandidate,
  roleTitle: string,
  companyName = "Tim Rekrutmen",
): string {
  const org = companyName.trim() || "Tim Rekrutmen";
  const focusLines = candidate.interviewFocusAreas
    .map((area, idx) => `${idx + 1}. ${area}`)
    .join("\n");

  return [
    `Subjek: Undangan Wawancara — ${roleTitle} (${org})`,
    "",
    `Halo ${candidate.candidateName},`,
    "",
    `Terima kasih telah melamar untuk posisi ${roleTitle} di ${org}. Setelah meninjau CV Anda, kami ingin mengundang Anda ke tahap wawancara awal (durasi sekitar 45 menit secara daring).`,
    "",
    "Beberapa topik utama yang akan kita diskusikan:",
    focusLines,
    "",
    "Mohon balas pesan ini dengan 2–3 pilihan jadwal yang tersedia dalam 3 hari kerja ke depan.",
    "",
    "Salam,",
    `Tim Rekrutmen ${org}`,
  ].join("\n");
}
