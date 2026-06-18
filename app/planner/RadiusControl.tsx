"use client";

import { useState } from "react";
import type { Ring } from "./MapView";

export default function RadiusControl({
  rings,
  canAdd,
  onAdd,
  onRemove,
  onClear,
  onRequestLocate,
}: {
  rings: Ring[];
  canAdd: boolean;
  onAdd: (radiusKm: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onRequestLocate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("5");

  function add() {
    const km = parseFloat(value.replace(",", "."));
    if (!Number.isFinite(km) || km <= 0) return;
    if (!canAdd) {
      onRequestLocate();
      return;
    }
    onAdd(km);
  }

  return (
    <div className="absolute bottom-44 left-3 z-[1000]">
      {open && (
        <div className="panel animate-rise absolute bottom-full left-0 mb-2 w-60 rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-pine">
              Radio desde tu ubicación
            </span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-moss">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1 rounded-xl bg-pine/8 px-3 py-2">
              <input
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.5"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                aria-label="Radio en kilómetros"
                className="w-full bg-transparent text-sm text-pine focus:outline-none"
              />
              <span className="text-xs font-semibold text-moss">km</span>
            </div>
            <button
              onClick={add}
              className="rounded-xl bg-blaze px-3 py-2 text-sm font-semibold text-paper transition active:scale-95"
            >
              Agregar
            </button>
          </div>

          {!canAdd && (
            <p className="mt-2 text-[11px] text-blaze-deep">
              Necesito tu ubicación — tocá para activarla.
            </p>
          )}

          {rings.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {rings.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-pine/5 px-3 py-1.5"
                >
                  <span className="font-mono text-xs text-pine">{r.radiusKm} km</span>
                  <button
                    onClick={() => onRemove(r.id)}
                    aria-label={`Quitar círculo de ${r.radiusKm} km`}
                    className="text-moss transition hover:text-blaze"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={onClear}
                  className="mt-1 w-full rounded-lg py-1.5 text-xs font-medium text-blaze-deep transition hover:bg-pine/5"
                >
                  Quitar todos
                </button>
              </li>
            </ul>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Círculos de radio"
        aria-expanded={open}
        className="panel grid h-12 w-12 place-items-center rounded-full text-pine transition active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="var(--pine-soft)" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="12" cy="12" r="4.5" stroke="var(--pine)" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="1.6" fill="var(--blaze)" />
        </svg>
      </button>
    </div>
  );
}
