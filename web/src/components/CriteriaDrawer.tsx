"use client";

import { useEffect, useRef } from "react";
import { Loader2, Play, X } from "lucide-react";
import type { RolePreset } from "@/lib/types";

interface CriteriaDrawerProps {
  open: boolean;
  presets: RolePreset[];
  selectedPresetId: string;
  roleTitle: string;
  criteriaText: string;
  mustHaveText: string;
  showRunScreening?: boolean;
  isScreening?: boolean;
  onSelectPreset: (presetId: string) => void;
  onChangeRoleTitle: (val: string) => void;
  onChangeCriteriaText: (val: string) => void;
  onChangeMustHaveText: (val: string) => void;
  onStartScreening?: () => void;
  onClose: () => void;
}

export function CriteriaDrawer({
  open,
  presets,
  selectedPresetId,
  roleTitle,
  criteriaText,
  mustHaveText,
  showRunScreening = false,
  isScreening = false,
  onSelectPreset,
  onChangeRoleTitle,
  onChangeCriteriaText,
  onChangeMustHaveText,
  onStartScreening,
  onClose,
}: CriteriaDrawerProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
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
  }, [open]);

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
          {showRunScreening && onStartScreening ? (
            <>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                disabled={isScreening}
                onClick={() => {
                  onClose();
                  onStartScreening();
                }}
                className="btn-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-all disabled:opacity-50"
              >
                {isScreening ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <Play className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                <span>Mulai Screening</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={onClose}
              className="btn-primary inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-semibold transition-all"
            >
              Simpan Kriteria
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
