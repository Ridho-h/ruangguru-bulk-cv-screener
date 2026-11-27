"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { RolePreset } from "@/lib/types";

interface CriteriaDrawerProps {
  open: boolean;
  presets: RolePreset[];
  selectedPresetId: string;
  roleTitle: string;
  companyName: string;
  criteriaText: string;
  mustHaveText: string;
  onSelectPreset: (presetId: string) => void;
  onChangeRoleTitle: (val: string) => void;
  onChangeCompanyName: (val: string) => void;
  onChangeCriteriaText: (val: string) => void;
  onChangeMustHaveText: (val: string) => void;
  onClose: () => void;
}

export function CriteriaDrawer({
  open,
  presets,
  selectedPresetId,
  roleTitle,
  companyName,
  criteriaText,
  mustHaveText,
  onSelectPreset,
  onChangeRoleTitle,
  onChangeCompanyName,
  onChangeCriteriaText,
  onChangeMustHaveText,
  onClose,
}: CriteriaDrawerProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-[180ms] ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
      aria-labelledby="criteria-drawer-title"
    >
      <div
        className="fixed inset-0 bg-[#0F172A]/25"
        onClick={open ? onClose : undefined}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`relative z-10 flex h-full w-full max-w-[460px] flex-col border-l border-[#E6E9EF] bg-[#FFFFFF] shadow-xl transition-transform duration-[180ms] ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E6E9EF] px-5 py-4">
          <div>
            <h2
              id="criteria-drawer-title"
              className="text-[16px] font-semibold tracking-tight text-[#0F172A]"
            >
              Kriteria Penilaian
            </h2>
            <p className="mt-0.5 text-[12px] text-[#475569]">
              Sesuaikan rubrik posisi sebelum menjalankan screening kandidat.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            aria-label="Tutup panel kriteria"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#475569] transition-colors duration-150 hover:bg-[#F7F8FA] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <label
              htmlFor="drawer-preset-select"
              className="block text-[12px] font-medium text-[#475569]"
            >
              Template Posisi
            </label>
            <select
              id="drawer-preset-select"
              tabIndex={open ? 0 : -1}
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] sm:text-[13px]"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.roleTitle}
                </option>
              ))}
              {selectedPresetId === "custom" ? (
                <option value="custom">Kustom</option>
              ) : null}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="criteria-role-title"
                className="block text-[12px] font-medium text-[#475569]"
              >
                Nama Posisi
              </label>
              <input
                id="criteria-role-title"
                type="text"
                tabIndex={open ? 0 : -1}
                value={roleTitle}
                onChange={(e) => onChangeRoleTitle(e.target.value)}
                placeholder="Contoh: Junior AI Engineer"
                className="mt-1.5 h-9 w-full rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] sm:text-[13px]"
              />
            </div>

            <div>
              <label
                htmlFor="criteria-company"
                className="block text-[12px] font-medium text-[#475569]"
              >
                Nama Perusahaan
              </label>
              <input
                id="criteria-company"
                type="text"
                tabIndex={open ? 0 : -1}
                value={companyName}
                onChange={(e) => onChangeCompanyName(e.target.value)}
                placeholder="Contoh: Ruangguru"
                className="mt-1.5 h-9 w-full rounded-md border border-[#E6E9EF] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] sm:text-[13px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="criteria-description"
              className="block text-[12px] font-medium text-[#475569]"
            >
              Deskripsi &amp; Fokus Penilaian
            </label>
            <textarea
              id="criteria-description"
              rows={5}
              tabIndex={open ? 0 : -1}
              value={criteriaText}
              onChange={(e) => onChangeCriteriaText(e.target.value)}
              placeholder="Jelaskan tanggung jawab utama dan profil kandidat yang dicari..."
              className="mt-1.5 w-full rounded-md border border-[#E6E9EF] bg-[#FFFFFF] p-3 text-[16px] leading-relaxed text-[#0F172A] sm:text-[13px]"
            />
          </div>

          <div>
            <label
              htmlFor="criteria-must-have"
              className="block text-[12px] font-medium text-[#475569]"
            >
              Syarat Wajib (Must-Have)
            </label>
            <textarea
              id="criteria-must-have"
              rows={3}
              tabIndex={open ? 0 : -1}
              value={mustHaveText}
              onChange={(e) => onChangeMustHaveText(e.target.value)}
              placeholder="Contoh: Python, RAG, REST API, Git"
              className="mt-1.5 w-full rounded-md border border-[#E6E9EF] bg-[#FFFFFF] p-3 text-[16px] leading-relaxed text-[#0F172A] sm:text-[13px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E6E9EF] bg-[#F7F8FA] px-5 py-3.5">
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
          >
            Simpan Kriteria
          </button>
        </div>
      </aside>
    </div>
  );
}
