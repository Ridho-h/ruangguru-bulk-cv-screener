import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Screening CV — Bulk Candidate Evaluation",
  description:
    "Workspace penyaringan CV massal berbasis RAG dan evaluasi terstruktur untuk tim rekrutmen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="min-h-screen bg-[#FFFFFF] text-[#0F172A] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
