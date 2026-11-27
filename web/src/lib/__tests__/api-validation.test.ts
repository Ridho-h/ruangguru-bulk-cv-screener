import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as screenPost } from "../../app/api/screen/route";
import { GET as samplesGet } from "../../app/api/samples/route";

describe("GET /api/samples", () => {
  it("lists all 10 bundled Indonesian sample CV PDFs", async () => {
    const res = await samplesGet();
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      samples: Array<{ name: string; url: string; sizeBytes: number }>;
    };
    expect(data.samples).toHaveLength(10);
    expect(data.samples.every((s) => s.name.endsWith(".pdf"))).toBe(true);
    expect(data.samples.every((s) => s.sizeBytes > 0)).toBe(true);
  });
});

describe("POST /api/screen validation (Review Focus #5)", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-dummy-key-for-validation";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("returns 500 with clear Indonesian message when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const form = new FormData();
    form.set("useSamples", "true");
    form.set("roleTitle", "Junior AI Engineer");
    form.set("criteriaText", "Menguasai Python, LLM, RAG, dan API backend.");

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("GEMINI_API_KEY");
    expect(body.error).not.toMatch(/stack|TypeError|at\s+\w+/i);
  });

  it("returns 400 when no PDF files are uploaded and useSamples is false", async () => {
    const form = new FormData();
    form.set("roleTitle", "Junior AI Engineer");
    form.set("criteriaText", "Menguasai Python, LLM, RAG, dan API backend.");

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error.toLowerCase()).toContain("cv");
  });

  it("returns 400 when criteria text is too short", async () => {
    const form = new FormData();
    form.set("useSamples", "true");
    form.set("roleTitle", "Junior AI Engineer");
    form.set("criteriaText", "pendek");

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error.toLowerCase()).toContain("kriteria");
  });

  it("returns 400 when uploading non-PDF file", async () => {
    const form = new FormData();
    form.set("roleTitle", "Junior AI Engineer");
    form.set("criteriaText", "Menguasai Python, LLM, RAG, dan API backend.");
    form.append(
      "files",
      new File(["halo dunia"], "catatan.txt", { type: "text/plain" }),
    );

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error.toLowerCase()).toContain("pdf");
  });

  it("returns 400 when uploading more than 30 files", async () => {
    const form = new FormData();
    form.set("roleTitle", "Junior AI Engineer");
    form.set("criteriaText", "Menguasai Python, LLM, RAG, dan API backend.");
    for (let i = 0; i < 31; i += 1) {
      form.append(
        "files",
        new File(["%PDF-1.4 dummy"], `cv-${i}.pdf`, { type: "application/pdf" }),
      );
    }

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("30");
  });

  it("returns 400 when a single PDF exceeds 10MB", async () => {
    const form = new FormData();
    form.set("roleTitle", "Junior AI Engineer");
    form.set("criteriaText", "Menguasai Python, LLM, RAG, dan API backend.");
    const bigBuffer = new Uint8Array(10 * 1024 * 1024 + 10);
    form.append(
      "files",
      new File([bigBuffer], "oversize.pdf", { type: "application/pdf" }),
    );

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("10 MB");
  });

  it("returns 400 when roleTitle is shorter than 2 characters", async () => {
    const form = new FormData();
    form.set("useSamples", "true");
    form.set("roleTitle", "A");
    form.set("criteriaText", "Menguasai Python, LLM, RAG, dan API backend.");

    const req = new Request("http://localhost/api/screen", {
      method: "POST",
      body: form,
    });
    const res = await screenPost(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error.toLowerCase()).toContain("posisi");
  });
});
