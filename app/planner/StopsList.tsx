"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { LatLng } from "@/lib/types";

const ROW_H = 46; // approximate row height for drag math

export default function StopsList({
  waypoints,
  labelFor,
  onReorder,
  onRemove,
  onCenter,
}: {
  waypoints: LatLng[];
  labelFor: (p: LatLng) => string | null;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onCenter: (index: number) => void;
}) {
  const drag = useRef<{ from: number; startY: number } | null>(null);
  const [info, setInfo] = useState<{ from: number; to: number } | null>(null);

  if (waypoints.length === 0) return null;
  const n = waypoints.length;

  function onDown(e: PointerEvent, i: number) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { from: i, startY: e.clientY };
    setInfo({ from: i, to: i });
  }
  function onMove(e: PointerEvent) {
    if (!drag.current) return;
    const delta = Math.round((e.clientY - drag.current.startY) / ROW_H);
    const to = Math.max(0, Math.min(n - 1, drag.current.from + delta));
    setInfo({ from: drag.current.from, to });
  }
  function onUp() {
    const d = drag.current;
    const cur = info;
    drag.current = null;
    setInfo(null);
    if (d && cur && cur.to !== d.from) onReorder(d.from, cur.to);
  }

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-moss">Paradas</h3>
        <span className="text-[11px] text-moss">tocá el mapa para sumar</span>
      </div>
      <ul className="flex flex-col gap-1">
        {waypoints.map((w, i) => {
          const label = labelFor(w) ?? `Parada ${i + 1}`;
          const letter = String.fromCharCode(65 + Math.min(i, 25));
          const isOrigin = i === 0;
          const isDest = i === n - 1 && n > 1;
          const dragging = info?.from === i;
          const target = info && info.to === i && info.from !== i;
          return (
            <li
              key={i}
              className={`flex items-center gap-1.5 rounded-xl px-1.5 py-1.5 transition-colors ${
                dragging ? "bg-blaze/15" : target ? "bg-pine/10" : "bg-pine/5"
              }`}
            >
              <button
                onPointerDown={(e) => onDown(e, i)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                aria-label="Arrastrar para reordenar"
                className="grid h-7 w-6 shrink-0 cursor-grab touch-none place-items-center text-moss active:cursor-grabbing"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
                  <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
                  <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
                </svg>
              </button>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-paper ${
                  isOrigin ? "bg-pine" : isDest ? "bg-blaze" : "bg-moss"
                }`}
              >
                {letter}
              </span>
              <button
                onClick={() => onCenter(i)}
                className="min-w-0 flex-1 truncate text-left text-sm text-pine"
              >
                {label}
              </button>
              <button
                onClick={() => i > 0 && onReorder(i, i - 1)}
                disabled={i === 0}
                aria-label="Subir parada"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-pine-soft transition hover:bg-pine/10 disabled:opacity-25"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 6v12M7 11l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => i < n - 1 && onReorder(i, i + 1)}
                disabled={i === n - 1}
                aria-label="Bajar parada"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-pine-soft transition hover:bg-pine/10 disabled:opacity-25"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 18V6M7 13l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => onRemove(i)}
                aria-label="Quitar parada"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-moss transition hover:bg-blaze hover:text-paper"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
