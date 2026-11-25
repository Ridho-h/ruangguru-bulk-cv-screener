# Bulk CV Screening Web App (Next.js)

Aplikasi web penyaringan CV massal (**Bulk CV Screening**) berbasis **Next.js (App Router + TypeScript + Tailwind CSS)** dan **Google Gemini API (`@google/genai`)**, dirancang dengan gaya workspace HR-Tech ATS yang bersih, tenang, dan siap deploy 1-klik ke Vercel.

## Fitur Utama

- **Unggah Multi-PDF & 6 Sample CV Bawaan:** Mendukung drag-and-drop hingga 30 file CV PDF (maksimal 10 MB/file) serta tombol 1-klik **Muat 6 CV contoh** untuk demonstrasi instan.
- **RAG + Evaluasi Terstruktur Paralel:** Menghitung kemiripan semantik awal melalui `gemini-embedding-001` (batched `<= 80`) lalu mengevaluasi setiap kandidat secara paralel (`concurrency = 4`, timeout `30s`) menggunakan `gemini-3.5-flash-lite` dengan auto-fallback ke `gemini-3.1-flash-lite`.
- **Tabel `Candidates` Terurut & Scrollable:** Tinggi terbatas (`max-h-[360px]`) dengan *sticky header*, pencarian nama/lokasi, filter (`Semua`, `Direkomendasikan`, `High`, `Medium`, `Low`), dan **Export CSV** aman dari *Excel formula injection*.
- **Slide-Over Drawer `AI Recommendation`:** Klik tombol **Detail** pada kandidat untuk membuka panel kanan berisi 3 SVG donut gauges (`Job Match`, `Experience`, `Technical Skills`), ringkasan, kelebihan & catatan, 3 poin bernomor **Interview Focus Areas**, serta generator **Draft Undangan** wawancara dengan tombol salin 1-klik.
- **Keamanan API Key:** `GEMINI_API_KEY` hanya dibaca di server Next.js (`src/app/api/screen/route.ts`) dan tidak pernah terekspos ke browser.

## Menjalankan di Lokal

1. Masuk ke folder aplikasi dan pasang dependensi:

   ```bash
   cd bulk-cv-screener-web
   npm install
   ```

2. Salin `.env.example` menjadi `.env.local` lalu isi `GEMINI_API_KEY` dari Google AI Studio:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

3. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`.

## Menjalankan Pengujian & Build Produksi

```bash
npm test
npm run typecheck
npm run build
```

## Deploy ke Vercel (Gratis)

1. Push folder `bulk-cv-screener-web` ke repositori GitHub Anda.
2. Buka [Vercel Dashboard](https://vercel.com/new) dan impor repositori tersebut.
3. Jika repositori berisi beberapa folder, atur **Root Directory** ke `web`.
4. Pada bagian **Environment Variables**, tambahkan:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** API Key Gemini Anda
5. Klik **Deploy**.
