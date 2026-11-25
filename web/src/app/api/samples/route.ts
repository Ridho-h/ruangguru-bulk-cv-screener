import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface SampleCvItem {
  name: string;
  url: string;
  sizeBytes: number;
}

export async function GET() {
  try {
    const sampleDir = path.join(process.cwd(), "public", "sample-cvs");
    if (!fs.existsSync(sampleDir)) {
      return NextResponse.json({ samples: [] satisfies SampleCvItem[] });
    }

    const entries = fs
      .readdirSync(sampleDir)
      .filter((name) => name.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => a.localeCompare(b));

    const samples: SampleCvItem[] = entries.map((name) => {
      const stat = fs.statSync(path.join(sampleDir, name));
      return {
        name,
        url: `/sample-cvs/${encodeURIComponent(name)}`,
        sizeBytes: stat.size,
      };
    });

    return NextResponse.json({ samples });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat daftar file CV contoh dari server." },
      { status: 500 },
    );
  }
}
