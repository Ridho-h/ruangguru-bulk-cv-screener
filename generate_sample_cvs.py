"""Generator 10 file PDF CV kandidat realistis Indonesia untuk demo Bulk CV Screening."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

SAMPLE_PROFILES: list[dict[str, str]] = [
    {
        "filename": "01_Nadia_Kusuma_AI_Engineer.pdf",
        "name": "Nadia Kusuma",
        "headline": "Junior AI Engineer | LLM, RAG & Agentic Workflow",
        "contact": "Jakarta Selatan | nadia.kusuma@email.id | github.com/nadiakusuma | linkedin.com/in/nadiakusuma",
        "summary": (
            "Lulusan S1 Ilmu Komputer dengan pengalaman 1,5 tahun membangun aplikasi LLM berbasis Python, "
            "pipeline Retrieval Augmented Generation (RAG), dan AI Agent untuk produk edukasi serta customer support. "
            "Terbiasa mengukur performa model dengan metrik evaluasi objektif dan membuat prototipe UI interaktif dengan Streamlit."
        ),
        "experience": (
            "AI Engineer Intern -> Junior AI Engineer | PT EduTech Nusantara (Jan 2025 - Sekarang)\n"
            "- Membangun sistem RAG Tanya-Jawab Kurikulum menggunakan Python, Gemini API, dan Pinecone untuk 12.000+ siswa aktif (akurasi retrieval 91%, latensi rata-rata 1,8 detik).\n"
            "- Merancang AI Agent multi-langkah dengan structured JSON output (Pydantic) dan function calling untuk otomatisasi penilaian esai, memangkas waktu koreksi tutor sebesar 64%.\n"
            "- Membangun dashboard internal evaluasi prompt & hallucination rate menggunakan Streamlit untuk tim produk.\n\n"
            "Asisten Laboratorium Machine Learning | Universitas Indonesia (2023 - 2024)\n"
            "- Membimbing 60 mahasiswa praktikum Python, Pandas, Scikit-learn, dan dasar NLP dengan Hugging Face Transformers.\n"
            "- Membuat repositori latihan terstandar di GitHub dengan unit testing pytest."
        ),
        "education": "S1 Ilmu Komputer - Universitas Indonesia (2020 - 2024) | IPK 3.82 / 4.00",
        "skills": (
            "Python, Gemini API, OpenAI API, Prompt Engineering, RAG, Embeddings, Pinecone, LangChain, "
            "n8n Workflow Automation, Streamlit, Gradio, FastAPI, Pydantic, PyTorch, Git & GitHub, Docker dasar"
        ),
    },
    {
        "filename": "02_Rizky_Mahendra_ML_Engineer.pdf",
        "name": "Rizky Mahendra",
        "headline": "Machine Learning & Applied AI Engineer",
        "contact": "Bandung (Siap Hybrid Jakarta) | rizky.mahendra@email.id | github.com/rizkyml",
        "summary": (
            "Applied ML & AI Engineer dengan pengalaman 2 tahun pada NLP, model klasifikasi teks, dan integrasi LLM API. "
            "Fokus pada solusi produksi yang terukur dengan evaluasi F1-score, latensi, serta antarmuka demo yang mudah dipakai tim non-teknis."
        ),
        "experience": (
            "Junior Machine Learning Engineer | PT FinPay Digital (Mei 2024 - Sekarang)\n"
            "- Mengembangkan pipeline ekstraksi dokumen KYC & klasifikasi tiket keluhan menggunakan Python, PyTorch, dan LLM API (F1-score 89%, menghemat 180 jam kerja tim ops per bulan).\n"
            "- Mengimplementasikan semantic search berbasis embeddings untuk membantu agen CS menemukan SOP internal 3x lebih cepat.\n"
            "- Membuat aplikasi prototipe Streamlit dan REST API FastAPI terintegrasi GitHub Actions.\n\n"
            "Proyek Portofolio: Automated Meeting Summarizer & Action Tracker (2025)\n"
            "- Membangun workflow n8n + LLM untuk merangkum transkrip rapat otomatis ke Notion dan Slack dengan validasi JSON."
        ),
        "education": "S1 Teknik Informatika - Institut Teknologi Bandung (2020 - 2024) | IPK 3.74 / 4.00",
        "skills": (
            "Python, PyTorch, Scikit-learn, Hugging Face Transformers, LLM API (Gemini/OpenAI), RAG, "
            "Vector Search, n8n, Streamlit, FastAPI, SQL, Docker, Git & GitHub"
        ),
    },
    {
        "filename": "03_Dimas_Pratama_Backend_Python.pdf",
        "name": "Dimas Pratama",
        "headline": "Backend Python Developer | REST API & Automation",
        "contact": "Yogyakarta (Terbuka Remote) | dimas.pratama@email.id | github.com/dimaspy",
        "summary": (
            "Backend Developer berpengalaman 1,5 tahun membangun API Python (FastAPI/Django) dan integrasi database PostgreSQL. "
            "Sedang aktif mempelajari pengembangan LLM API dan AI Agent melalui proyek sampingan untuk beralih ke peran AI Engineer."
        ),
        "experience": (
            "Junior Backend Developer | CV Solusi Awan Digital (Agu 2024 - Sekarang)\n"
            "- Membangun 15+ endpoint REST API dengan Python FastAPI dan PostgreSQL untuk sistem manajemen inventaris klien UMKM.\n"
            "- Menulis script otomasi Python untuk sinkronisasi laporan harian ke Google Sheets, menghemat 6 jam kerja mingguan.\n"
            "- Menerapkan unit test pytest dan code review rutin di GitHub.\n\n"
            "Proyek Sampingan: Bot Ringkasan Berita Harian (2025)\n"
            "- Menggunakan OpenAI API dasar untuk meringkas artikel berita dalam format teks sederhana (belum memakai RAG atau vector database)."
        ),
        "education": "S1 Teknologi Informasi - Universitas Gadjah Mada (2020 - 2024) | IPK 3.56 / 4.00",
        "skills": (
            "Python, FastAPI, Django, PostgreSQL, SQL, Git & GitHub, Docker, Unit Testing (pytest), "
            "Prompt Engineering dasar, OpenAI API dasar"
        ),
    },
    {
        "filename": "04_Siti_Rahmawati_Data_Analyst.pdf",
        "name": "Siti Rahmawati",
        "headline": "Data Analyst | Business Intelligence & Python Analytics",
        "contact": "Surabaya | siti.rahmawati@email.id | linkedin.com/in/sitirahmawati",
        "summary": (
            "Data Analyst dengan pengalaman 2 tahun menganalisis data penjualan e-commerce menggunakan SQL, Pandas, dan Looker Studio. "
            "Memiliki dasar Machine Learning (Scikit-learn) dan tertarik memperdalam bidang AI Engineering."
        ),
        "experience": (
            "Data Analyst | PT Ritel Niaga Sejahtera (Jul 2024 - Sekarang)\n"
            "- Membangun 10+ dashboard KPI penjualan dan retensi pelanggan menggunakan SQL, BigQuery, dan Looker Studio.\n"
            "- Membersihkan dataset transaksi 500 ribu baris dengan Python Pandas dan membuat model regresi sederhana untuk estimasi stok.\n"
            "- Mempresentasikan insight mingguan kepada manajemen pemasaran.\n\n"
            "Magang Data Analytics | Startup Logistik Cepat (Jan 2024 - Jun 2024)\n"
            "- Melakukan analisis keterlambatan pengiriman dan membuat laporan visualisasi Matplotlib serta Excel."
        ),
        "education": "S1 Statistika - Institut Teknologi Sepuluh Nopember (2020 - 2024) | IPK 3.68 / 4.00",
        "skills": (
            "SQL, BigQuery, Python dasar, Pandas, Scikit-learn dasar, Matplotlib, Looker Studio, Tableau, Microsoft Excel"
        ),
    },
    {
        "filename": "05_Bagus_Setiawan_Frontend_Web.pdf",
        "name": "Bagus Setiawan",
        "headline": "Frontend Web Developer | React & Tailwind CSS",
        "contact": "Tangerang | bagus.setiawan@email.id | github.com/bagusfe",
        "summary": (
            "Frontend Developer dengan fokus membangun antarmuka landing page dan web app responsif menggunakan React, TypeScript, "
            "dan Tailwind CSS. Terbiasa bekerja sama dengan desainer Figma untuk meningkatkan konversi halaman web."
        ),
        "experience": (
            "Frontend Developer | Agency Kreatif Web Nusantara (Mar 2024 - Sekarang)\n"
            "- Mengembangkan 12+ landing page kampanye promosi klien menggunakan Next.js, React, dan Tailwind CSS dengan skor Lighthouse 95+.\n"
            "- Mengintegrasikan formulir pendaftaran klien dengan API REST eksternal dan Google Analytics.\n"
            "- Berkolaborasi menggunakan Git dan Jira bersama tim desain UI/UX.\n\n"
            "Freelance Web Designer (2023 - 2024)\n"
            "- Membuat website company profile berbasis WordPress dan HTML/CSS untuk 8 bisnis lokal."
        ),
        "education": "S1 Sistem Informasi - Universitas Bina Nusantara (2020 - 2024) | IPK 3.41 / 4.00",
        "skills": (
            "JavaScript, TypeScript, React, Next.js, HTML5, CSS3, Tailwind CSS, Figma, WordPress, Git"
        ),
    },
    {
        "filename": "06_Fajar_Nugroho_Admin_Operasional.pdf",
        "name": "Fajar Nugroho",
        "headline": "Staf Administrasi & Operasional Kantor",
        "contact": "Semarang | fajar.nugroho@email.id | 0812-3456-7890",
        "summary": (
            "Staf administrasi dan operasional yang teliti dengan pengalaman 3 tahun mengelola arsip dokumen, penjadwalan pengiriman, "
            "pembukuan kas kecil, serta koordinasi vendor harian menggunakan Microsoft Office dan Google Workspace."
        ),
        "experience": (
            "Admin Operasional | PT Makmur Distribusi Sentosa (2023 - Sekarang)\n"
            "- Mengelola pencatatan faktur pembelian, surat jalan, dan rekap absensi 45 karyawan menggunakan Microsoft Excel.\n"
            "- Mengatur jadwal pengiriman barang harian bersama tim gudang dan ekspedisi.\n"
            "- Menyusun laporan pengeluaran operasional bulanan untuk divisi keuangan.\n\n"
            "Staf Administrasi Gudang | CV Jaya Abadi (2022 - 2023)\n"
            "- Melakukan stock opname berkala dan input data keluar-masuk barang."
        ),
        "education": "D3 Administrasi Bisnis - Politeknik Negeri Semarang (2019 - 2022) | IPK 3.50 / 4.00",
        "skills": (
            "Microsoft Excel (VLOOKUP, Pivot Table), Microsoft Word, Google Sheets, Pengarsipan Dokumen, Administrasi Perkantoran, Komunikasi"
        ),
    },
    {
        "filename": "07_Aulia_Rahman_LLM_Engineer.pdf",
        "name": "Aulia Rahman",
        "headline": "AI & NLP Engineer | RAG, Fine-Tuning & Production API",
        "contact": "Depok | aulia.rahman@email.id | github.com/auliarahman-ai",
        "summary": (
            "AI Engineer dengan pengalaman 2 tahun membangun sistem pencarian semantik, pipeline RAG multi-dokumen, "
            "dan layanan inferensi LLM menggunakan Python, FastAPI, dan Docker untuk perusahaan SaaS B2B."
        ),
        "experience": (
            "AI Engineer | PT Aksara Cerdas Indonesia (Mar 2024 - Sekarang)\n"
            "- Merancang arsitektur RAG hybrid search (BM25 + vector embeddings) menggunakan Python, Gemini API, dan Qdrant untuk 50.000+ dokumen kontrak hukum (precision@5 mencapai 93%).\n"
            "- Membangun REST API inferensi dengan FastAPI, Redis caching, dan evaluasi otomatis prompt memakai pytest.\n\n"
            "Research Assistant NLP | Fakultas Ilmu Komputer UI (2023 - 2024)\n"
            "- Melakukan fine-tuning model bahasa Indonesia (IndoBERT & LoRA) untuk ekstraksi entitas berita finansial."
        ),
        "education": "S1 Ilmu Komputer - Universitas Indonesia (2020 - 2024) | IPK 3.79 / 4.00",
        "skills": (
            "Python, Gemini API, Prompt Engineering, RAG, Qdrant, Vector Search, FastAPI, PyTorch, "
            "Hugging Face, Docker, Redis, Git & GitHub, Evaluasi LLM"
        ),
    },
    {
        "filename": "08_Kevin_Wijaya_Data_Scientist.pdf",
        "name": "Kevin Wijaya",
        "headline": "Data Scientist | Predictive Modeling & Experimentation",
        "contact": "Jakarta Pusat | kevin.wijaya@email.id | linkedin.com/in/kevinwijayads",
        "summary": (
            "Data Scientist dengan pengalaman 2,5 tahun membangun model prediksi churn, credit scoring, dan A/B testing "
            "pada skala jutaan baris transaksi menggunakan Python, SQL, Scikit-learn, dan PyTorch."
        ),
        "experience": (
            "Data Scientist | PT Dana Nusantara Fintech (Jan 2024 - Sekarang)\n"
            "- Membangun model prediksi churn pelanggan dengan XGBoost & Logistic Regression (ROC-AUC 0.88), menurunkan churn bulanan sebesar 14%.\n"
            "- Merancang eksperimen A/B testing untuk kampanye retensi dan membuat pipeline fitur SQL di BigQuery.\n\n"
            "Junior Data Scientist | E-Commerce BelanjaKilat (2023 - 2024)\n"
            "- Mengembangkan model rekomendasi produk berbasis collaborative filtering dengan Python, Pandas, dan PyTorch."
        ),
        "education": "S1 Matematika - Institut Teknologi Bandung (2019 - 2023) | IPK 3.85 / 4.00",
        "skills": (
            "Python, SQL, BigQuery, Pandas, NumPy, Scikit-learn, XGBoost, PyTorch, "
            "Statistika, A/B Testing, Evaluasi Model & Eksperimen, Git"
        ),
    },
    {
        "filename": "09_Putri_Lestari_Backend_Engineer.pdf",
        "name": "Putri Lestari",
        "headline": "Backend Engineer | Python FastAPI, PostgreSQL & Cloud",
        "contact": "Malang (Siap Remote/Hybrid) | putri.lestari@email.id | github.com/putrilestari-dev",
        "summary": (
            "Backend Engineer berpengalaman 3 tahun merancang API berkinerja tinggi dengan Python (FastAPI/Django), "
            "optimasi query PostgreSQL, caching Redis, serta deployment container Docker di cloud."
        ),
        "experience": (
            "Backend Engineer | PT KirimCepat Logistik (Feb 2023 - Sekarang)\n"
            "- Membangun layanan REST API pelacakan paket dengan Python FastAPI yang menangani 1.200 request/detik dengan latensi p95 di bawah 120 ms.\n"
            "- Mengoptimalkan skema indeks PostgreSQL dan queue Celery/Redis, memangkas biaya server sebesar 28%.\n"
            "- Menyiapkan pipeline CI/CD GitHub Actions, Docker, dan automated testing pytest dengan coverage 85%.\n\n"
            "Junior Software Engineer | Studio Aplikasi Karya (2022 - 2023)\n"
            "- Mengembangkan modul autentikasi OAuth2 dan integrasi payment gateway menggunakan Django REST Framework."
        ),
        "education": "S1 Teknik Informatika - Universitas Brawijaya (2018 - 2022) | IPK 3.71 / 4.00",
        "skills": (
            "Python, FastAPI, Django, PostgreSQL, Redis, Docker, REST API, Microservices, "
            "Celery, Pytest, CI/CD GitHub Actions, Linux, Git"
        ),
    },
    {
        "filename": "10_Hendra_Gunawan_QA_Tester.pdf",
        "name": "Hendra Gunawan",
        "headline": "Quality Assurance Manual Tester",
        "contact": "Bekasi | hendra.gunawan@email.id | linkedin.com/in/hendragunawanqa",
        "summary": (
            "QA Manual Tester dengan pengalaman 2 tahun menyusun skenario uji fungsional, melakukan regression testing "
            "aplikasi web dan mobile, serta mendokumentasikan laporan bug bersama tim produk."
        ),
        "experience": (
            "QA Manual Tester | PT Solusi Retail Digital (Mei 2024 - Sekarang)\n"
            "- Menulis 250+ test case fungsional dan menjalankan pengujian UAT sebelum rilis mingguan aplikasi kasir.\n"
            "- Mencatat dan melacak status perbaikan bug menggunakan Jira serta melakukan pengecekan endpoint dasar di Postman.\n\n"
            "IT Support & Tester Magang | CV Mitra Sistem (2023 - 2024)\n"
            "- Membantu pengecekan tampilan antarmuka web dan menangani tiket kendala pengguna internal."
        ),
        "education": "S1 Sistem Informasi - Universitas Gunadarma (2019 - 2023) | IPK 3.38 / 4.00",
        "skills": (
            "Manual Testing, Test Case Design, UAT, Regression Testing, Jira, Trello, Postman dasar, Microsoft Excel"
        ),
    },
]


def _render_cv_pdf(profile: dict[str, str], output_path: Path) -> None:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()

    # Header
    pdf.set_fill_color(27, 42, 74)
    pdf.rect(0, 0, 210, 34, "F")
    pdf.set_xy(15, 8)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 8, profile["name"], new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(15)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(180, 238, 242)
    pdf.cell(0, 6, profile["headline"], new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(15)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(226, 232, 240)
    pdf.cell(0, 6, profile["contact"], new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)

    def _section(title: str, body: str) -> None:
        pdf.set_text_color(0, 145, 160)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, title.upper(), new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(226, 232, 240)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
        pdf.ln(2)
        pdf.set_text_color(30, 41, 59)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5.5, body)
        pdf.ln(4)

    pdf.set_left_margin(15)
    pdf.set_right_margin(15)
    _section("Ringkasan Profil", profile["summary"])
    _section("Pengalaman & Proyek", profile["experience"])
    _section("Pendidikan", profile["education"])
    _section("Keahlian Teknis & Tools", profile["skills"])

    pdf.output(str(output_path))


def generate_all_sample_pdfs(output_dir: Path | None = None) -> list[Path]:
    target_dir = output_dir or (Path(__file__).resolve().parent / "sample_cvs")
    target_dir.mkdir(parents=True, exist_ok=True)
    created: list[Path] = []
    for profile in SAMPLE_PROFILES:
        out_path = target_dir / profile["filename"]
        _render_cv_pdf(profile, out_path)
        created.append(out_path)
    return created


if __name__ == "__main__":
    paths = generate_all_sample_pdfs()
    print(f"Berhasil membuat {len(paths)} sample CV PDF di: {paths[0].parent}")
