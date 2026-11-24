# 🎯 Ready-to-Use AI Bulk CV Screening Tool (Streamlit SaaS App)

**Program:** AI Engineer Bootcamp — Ruangguru  
**Format:** Aplikasi Web Streamlit Siap Pakai (Tanpa Google Colab)  
**Angle Utama:** *Employee / Company Impact POV* — membangun solusi AI internal untuk mempercepat screening puluhan CV kandidat perusahaan secara objektif dan konsisten.

---

## 1. Kenapa Use Case Ini Kuat (Bukan Sekadar "Upload ke ChatGPT")?

Meninjau 1 CV perorangan bisa dilakukan lewat chat biasa. Namun saat HR atau Hiring Manager menerima **puluhan CV PDF sekaligus**, mereka membutuhkan:
- **Evaluasi serentak & konsisten** terhadap kriteria spesifik role dan syarat wajib (*must-have*) perusahaan.
- **Ranking otomatis** dalam dashboard `Candidates` lengkap dengan badge **High / Medium / Low**, skor **0–100**, tanda **Recommended (✓ / ✕)**, fitur pencarian/filter, dan **Export CSV** untuk Excel.
- **Top Hire Recommendation** & kartu detail **AI Recommendation** berisi 3 skor ring (**Job Match %**, **Experience %**, **Technical Skills %**), **3 Interview Focus Areas** bernomor, serta **Draft Undangan Interview** siap salin.

Ini menunjukkan secara nyata bahwa lulusan **AI Engineer Bootcamp Ruangguru** mampu membangun **produk AI yang berdampak langsung bagi operasional perusahaan**.

---

## 2. Pemetaan ke Silabus AI Engineer Bootcamp

| Modul Silabus | Implementasi Nyata di Aplikasi Ini |
|---|---|
| **Python Basics — Introduction to Streamlit** | Aplikasi web SaaS modern (`app.py`, `ui_components.py`), bulk drag-and-drop multi-PDF, tabel ranking, 3 SVG Donut Gauges, filter interaktif, dan Export CSV. |
| **Prompt Engineering & RAG** | Ekstraksi teks multi-PDF (`pypdf`), batched vector embeddings (`gemini-embedding-001`), dan perhitungan Cosine Similarity terhadap kriteria role. |
| **Agentic AI** | Evaluasi paralel (`ThreadPoolExecutor` maks 4 worker) memakai Gemini Interactions API (`gemini-3.5-flash-lite` + auto-fallback `gemini-3.1-flash-lite`) dengan kontrak Structured Output JSON (`Pydantic`). |

---

## 3. Cara Menjalankan Lokal 1-Klik (Windows — Tanpa Repot Sensor API Key!)

### Setup 1x (Pemilik / Sebelum Rekam Konten)
1. Salin file `.streamlit/secrets.toml.example` menjadi `.streamlit/secrets.toml`.
2. Isi `GEMINI_API_KEY` gratis Anda (dari [Google AI Studio](https://aistudio.google.com/apikey)) di dalam `.streamlit/secrets.toml`:
   ```toml
   GEMINI_API_KEY = "AIzaSy..."
   ```
   > ✅ **Aman untuk rekam layar:** Dengan `.streamlit/secrets.toml`, API Key **tidak pernah tampil di layar aplikasi**, jadi tim socmed tidak perlu repot blur/sensor!

### Menjalankan Aplikasi (1 Klik)
1. Klik dua kali **`run_app.bat`** — browser otomatis membuka aplikasi Streamlit!
2. Untuk demo bulk screening seperti video SaaS HR-Tech:
   - **Cara A (Drag & Drop PDF Beneran):** Buka folder `sample_cvs/`, blok ke-6 file PDF kandidat, lalu tarik langsung ke kotak unggah di aplikasi!
   - **Cara B (1 Klik Instan):** Klik tombol **📂 Muat 6 Sample CV PDF**.
3. Klik **⚡ Mulai Bulk Screening AI (6 CV)** — dalam **~4–8 detik**, seluruh ranking, Top Hire banner, 3 Donut Gauges, dan 3 Interview Focus Areas langsung tampil!

---

## 4. Cara Deploy Gratis ke Streamlit Community Cloud (URL Publik untuk Tim Socmed)

Jika ingin tim socmed cukup membuka **1 link website** tanpa perlu instalasi di laptop mereka:
1. Push folder `bulk-cv-screener/` ke repositori GitHub (file `.gitignore` sudah otomatis mencegah `.streamlit/secrets.toml` dan `.venv/` ter-upload).
2. Buka [share.streamlit.io](https://share.streamlit.io) → klik **Create app** → pilih repo & file utama `app.py`.
3. Di menu **Advanced settings → Secrets**, tempel:
   ```toml
   GEMINI_API_KEY = "AIzaSy..."
   ```
4. Klik **Deploy!** — dalam 2 menit aplikasi langsung live di URL `https://<nama-app>.streamlit.app` dan siap dipakai tim socmed tanpa konfigurasi apa pun!

---

## 5. Daftar File Deliverable

| File / Folder | Fungsi |
|---|---|
| `app.py` | Aplikasi utama Streamlit bergaya SaaS HR-Tech. |
| `screener_engine.py` | Engine bulk screening paralel (`gemini-3.5-flash-lite` + RAG `gemini-embedding-001` + CSV & invite builder). |
| `ui_components.py` | Komponen visual SaaS (CSS, badge High/Medium/Low, 3 SVG Donut Gauges, AI Recommendation Card). |
| `sample_cvs/` | **6 file PDF CV kandidat Indonesia** (2 High, 2 Medium, 2 Low) siap drag-and-drop. |
| `run_app.bat` | Launcher 1-klik Windows. |
| `.streamlit/config.toml` & `requirements.txt` | Konfigurasi tema & dependensi siap deploy ke Streamlit Community Cloud. |
| `architecture_diagram.png` & `.html` | Diagram arsitektur resolusi tinggi Bahasa Indonesia. |
| `tests/` | Automated test suite (`pytest`) untuk engine, keamanan XSS, 6 sample PDF, dan validasi app. |
