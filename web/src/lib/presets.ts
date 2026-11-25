import type { RolePreset } from "./types";

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "junior-ai-engineer",
    roleTitle: "Junior AI Engineer",
    companyName: "Ruangguru",
    criteriaText:
      "Membangun fitur produk berbasis LLM, pipeline RAG, dan integrasi API backend menggunakan Python. Terbiasa mengevaluasi kualitas output model, mengelola prompt secara terstruktur, dan berkolaborasi dengan tim engineering.",
    mustHaveText:
      "Python, LLM / Prompt Engineering, RAG / Vector Search, REST API (FastAPI atau Flask), Git",
  },
  {
    id: "data-scientist-ml",
    roleTitle: "Data Scientist / ML Engineer",
    companyName: "Ruangguru",
    criteriaText:
      "Mengolah data skala besar, membangun model machine learning atau deep learning untuk prediksi bisnis, melakukan evaluasi metrik yang terukur, serta men-deploy model agar siap dipakai di lingkungan produksi.",
    mustHaveText:
      "Python, SQL, Pandas, Scikit-learn atau PyTorch, Evaluasi Model & Eksperimen",
  },
  {
    id: "ai-automation-specialist",
    roleTitle: "AI Automation Specialist",
    companyName: "Ruangguru",
    criteriaText:
      "Merancang otomatisasi alur kerja operasional lintas sistem (webhook, spreadsheet, CRM, email, dan API) dengan integrasi AI untuk klasifikasi dokumen, ekstraksi data, dan pelaporan otomatis.",
    mustHaveText:
      "Workflow Automation (n8n / Zapier / Make), REST API & Webhook, JSON / Data Mapping, Prompt Engineering",
  },
];
