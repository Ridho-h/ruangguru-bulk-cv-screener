import type { CandidateDocument } from "./types";

export const EMBEDDING_BATCH_SIZE = 80;
const MAX_EMBED_TEXT_CHARS = 4_000;

export interface EmbedClientLike {
  models: {
    embedContent(params: {
      model: string;
      contents: string[];
    }): Promise<{
      embeddings?: Array<{ values?: number[] }>;
    }>;
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function computeRagScores(
  client: EmbedClientLike,
  queryText: string,
  docs: CandidateDocument[],
  embeddingModel = "gemini-embedding-001",
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (docs.length === 0) return scores;

  const allInputs = [
    queryText.slice(0, MAX_EMBED_TEXT_CHARS),
    ...docs.map((doc) => doc.text.slice(0, MAX_EMBED_TEXT_CHARS)),
  ];

  const vectors: number[][] = [];
  for (let start = 0; start < allInputs.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = allInputs.slice(start, start + EMBEDDING_BATCH_SIZE);
    const response = await client.models.embedContent({
      model: embeddingModel,
      contents: batch,
    });
    const embeddings = response.embeddings ?? [];
    for (let i = 0; i < batch.length; i += 1) {
      vectors.push(embeddings[i]?.values ?? []);
    }
  }

  const queryVec = vectors[0] ?? [];
  for (let i = 0; i < docs.length; i += 1) {
    const docVec = vectors[i + 1] ?? [];
    const sim = cosineSimilarity(queryVec, docVec);
    const normalized = Math.max(0, Math.min(100, Math.round(sim * 100)));
    scores.set(docs[i].filename, normalized);
  }

  return scores;
}
