# Bulk CV Screening Web App (Next.js)

Aplikasi web **Screening CV** massal berbasis **Next.js (App Router + TypeScript + Tailwind CSS)** dan **Google Gemini API (`@google/genai`)**, dirancang sebagai workspace HR-Tech ATS yang bersih dan siap deploy 1-klik ke Vercel.

## Fitur Utama

- **Halaman Upload Simetris 50/50 & 10 Sample CV Bawaan:** Memisahkan tahap persiapan (pilih posisi, atur kriteria, unggah hingga 30 file PDF maks. 10 MB/file, atau 1-klik **Muat 10 CV contoh**) dari tampilan hasil, lengkap dengan halaman loading terpisah sebelum masuk ke tabel.
- **RAG + Evaluasi Terstruktur Paralel:** Menghitung kemiripan semantik awal melalui `gemini-embedding-001` (batched `<= 80`) lalu mengevaluasi setiap kandidat secara paralel (`concurrency = 4`, timeout `30s`) menggunakan `gemini-3.5-flash-lite` dengan auto-fallback ke `gemini-3.1-flash-lite`.
- **Rekomendasi Deterministik:** Status **Direkomendasikan (`Ya`)** diturunkan secara deterministik untuk kandidat dengan kecocokan **Tinggi** (skor `>= 75`), sehingga peringkat dan rekomendasi selalu konsisten.
- **Tabel Hasil Terpadu (1400px):** Menyatu dengan kanvas putih, *sticky header*, single scrollbar, pencarian nama/lokasi, popover **Filter** ikon-saja (kecocokan/rekomendasi & lokasi), tombol **Unduh CSV** ikon-saja aman dari *Excel formula injection*, serta tombol **Undang** langsung di samping **Detail**.
- **Panel Detail Kandidat & Kriteria Terpadu:** Klik **Detail** untuk melihat 3 skor gauge (*Kecocokan Peran*, *Pengalaman*, *Skill Teknis*), ringkasan, kelebihan & celah, serta 3 **Topik Wawancara**. Klik **Kriteria & Posisi** untuk mengganti template posisi, mengubah kriteria, dan menjalankan **Mulai Screening** ulang langsung dari satu panel.
- **Keamanan API Key:** `GEMINI_API_KEY` hanya dibaca di server Next.js (`src/app/api/screen/route.ts`) dan tidak pernah terekspos ke browser.

## Menjalankan di Lokal

1. Masuk ke folder aplikasi dan pasang dependensi:

   ```bash
   cd web
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

## Deploy ke Vercel

1. Push repositori ke GitHub dan impor di [Vercel Dashboard](https://vercel.com/new).
2. Atur **Root Directory** ke `web`.
3. Pada **Environment Variables**, tambahkan `GEMINI_API_KEY`.
4. Klik **Deploy**.
