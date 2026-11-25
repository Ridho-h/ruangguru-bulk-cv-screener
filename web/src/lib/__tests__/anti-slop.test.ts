import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const UI_DIRS = [
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "app"),
];

function collectFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe("Anti-AI-Slop & Security Guardrails", () => {
  const requiredComponents = [
    "TopBar.tsx",
    "UploadBar.tsx",
    "CriteriaDrawer.tsx",
    "CandidatesTable.tsx",
    "DonutGauge.tsx",
    "CandidateDrawer.tsx",
  ];

  it("contains all 6 Operate-mode UI components", () => {
    for (const file of requiredComponents) {
      const fullPath = path.join(ROOT, "src", "components", file);
      expect(fs.existsSync(fullPath), `Missing component ${file}`).toBe(true);
    }
  });

  it("has ZERO decorative emojis across all UI and app source files", () => {
    const emojiPattern = /\p{Extended_Pictographic}/u;
    const files = UI_DIRS.flatMap(collectFiles);
    expect(files.length).toBeGreaterThan(5);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      expect(
        emojiPattern.test(content),
        `Found decorative emoji in ${path.relative(ROOT, file)}`,
      ).toBe(false);
    }
  });

  it("contains ZERO forbidden legacy/banned Gemini model names or deprecated SDKs", () => {
    const allSrc = collectFiles(path.join(ROOT, "src")).filter(
      (f) => !f.includes("__tests__"),
    );
    const forbidden = [
      /hydrogen/i,
      /gemini-2\.5/i,
      /gemini-2\.0/i,
      /gemini-1\.5/i,
      /@google\/generative-ai/i,
    ];
    for (const file of allSrc) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(
          pattern.test(content),
          `Found forbidden pattern ${pattern} in ${path.relative(ROOT, file)}`,
        ).toBe(false);
      }
    }
  });

  it("never references GEMINI_API_KEY inside client components or page.tsx", () => {
    const clientFiles = [
      ...collectFiles(path.join(ROOT, "src", "components")),
      path.join(ROOT, "src", "app", "page.tsx"),
    ].filter((f) => fs.existsSync(f));

    for (const file of clientFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(
        content.includes("GEMINI_API_KEY"),
        `Client file must not reference GEMINI_API_KEY: ${path.relative(ROOT, file)}`,
      ).toBe(false);
    }
  });

  it("avoids promotional AI-slop copywriting in UI components", () => {
    const uiFiles = [
      ...collectFiles(path.join(ROOT, "src", "components")),
      path.join(ROOT, "src", "app", "page.tsx"),
    ].filter((f) => fs.existsSync(f));

    const slopPhrases = [
      /dalam hitungan detik/i,
      /solusi ai terdepan/i,
      /revolusioner/i,
      /supercharge/i,
      /powered by magic/i,
    ];

    for (const file of uiFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const phrase of slopPhrases) {
        expect(
          phrase.test(content),
          `Found AI-slop phrase ${phrase} in ${path.relative(ROOT, file)}`,
        ).toBe(false);
      }
    }
  });

  it("keeps CandidatesTable bounded-height scrollable without left checkboxes", () => {
    const tablePath = path.join(ROOT, "src", "components", "CandidatesTable.tsx");
    const content = fs.readFileSync(tablePath, "utf8");
    expect(content).toContain("max-h-[360px]");
    expect(content).not.toMatch(/type=["']checkbox["']/);
  });
});
