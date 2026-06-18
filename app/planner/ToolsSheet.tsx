"use client";

import { useState } from "react";
import { useCompass } from "./useCompass";
import { buildRecordedRoute } from "@/lib/tracking/recorder";
import type { useRecorder } from "./useRecorder";
import type { Ring } from "./MapView";
import type { Profile, Route } from "@/lib/types";

type Recorder = ReturnType<typeof useRecorder>;

function dist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-pine/5 p-3">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-moss">{title}</h3>
      {children}
    </div>
  );
}

export default function ToolsSheet({
  open,
  onClose,
  recorder,
  profile,
  onSaveRoute,
  measureActive,
  measureDistance,
  measurePointsCount,
  onToggleMeasure,
  onClearMeasure,
  rings,
  canAddRing,
  onAddRing,
  onRemoveRing,
  onClearRings,
  onRequestLocate,
}: {
  open: boolean;
  onClose: () => void;
  recorder: Recorder;
  profile: Profile;
  onSaveRoute: (route: Route, name: string) => void;
  measureActive: boolean;
  measureDistance: number;
  measurePointsCount: number;
  onToggleMeasure: () => void;
  onClearMeasure: () => void;
  rings: Ring[];
  canAddRing: boolean;
  onAddRing: (km: number) => void;
  onRemoveRing: (id: string) => void;
  onClearRings: () => void;
  onRequestLocate: () => void;
}) {
  const compass = useCompass();
  const [radiusValue, setRadiusValue] = useState("5");

  if (!open) return null;
  const recActive = recorder.status !== "idle";

  function stopRecording() {
    const fixes = recorder.stop();
    if (fixes.length >= 2) {
      const name = window.prompt(
        "Nombre del recorrido grabado:",
        `Salida ${new Date().toLocaleDateString("es")}`,
      );
      if (name && name.trim()) onSaveRoute(buildRecordedRoute(fixes, profile), name.trim());
    }
    recorder.reset();
  }

  function addRing() {
    const km = parseFloat(radiusValue.replace(",", "."));
    if (!Number.isFinite(km) || km <= 0) return;
    if (!canAddRing) {
      onRequestLocate();
      return;
    }
    onAddRing(km);
  }

  return (
    <div className="absolute inset-0 z-[1200] flex flex-col justify-end">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-pine/40 backdrop-blur-[2px]" />
      <div className="panel animate-rise relative max-h-[82%] overflow-auto rounded-t-3xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-pine/20" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-pine">Herramientas</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-moss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Grabar recorrido */}
          <Section title="Grabar recorrido">
            {!recActive ? (
              <button
                onClick={recorder.start}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blaze py-2.5 text-sm font-semibold text-paper transition active:scale-[0.98]"
              >
                <span className="h-3.5 w-3.5 rounded-full bg-paper" /> Empezar a grabar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono text-sm text-pine">
                  {dist(recorder.stats.distanceMeters)} · {(recorder.stats.avgSpeed * 3.6).toFixed(1)} km/h
                </span>
                <button
                  onClick={recorder.status === "recording" ? recorder.pause : recorder.resume}
                  className="rounded-xl border border-pine/15 px-3 py-2 text-xs font-semibold text-pine"
                >
                  {recorder.status === "recording" ? "Pausar" : "Seguir"}
                </button>
                <button
                  onClick={stopRecording}
                  className="rounded-xl bg-blaze px-3 py-2 text-xs font-semibold text-paper"
                >
                  Terminar
                </button>
              </div>
            )}
          </Section>

          {/* Brújula */}
          <Section title="Brújula">
            <div className="flex items-center justify-between">
              <button
                onClick={compass.active ? compass.stop : compass.start}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  compass.active ? "bg-pine/10 text-blaze-deep" : "bg-blaze text-paper"
                }`}
              >
                {compass.active ? "Apagar" : "Activar"}
              </button>
              <div className="flex items-center gap-2">
                {compass.heading != null && (
                  <span className="font-mono text-sm font-semibold text-pine">{Math.round(compass.heading)}°</span>
                )}
                <svg
                  width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden
                  style={{ transform: compass.heading != null ? `rotate(${-compass.heading}deg)` : undefined, transition: "transform .1s linear" }}
                >
                  <circle cx="12" cy="12" r="9" stroke="var(--pine-soft)" strokeWidth="1.2" />
                  <path d="M12 4l3 8-3-2-3 2 3-8z" fill="var(--blaze)" />
                  <path d="M12 20l-3-8 3 2 3-2-3 8z" fill="var(--pine-soft)" />
                </svg>
              </div>
            </div>
            {compass.error && <p className="mt-1 text-[11px] text-blaze-deep">{compass.error}</p>}
          </Section>

          {/* Medir distancia */}
          <Section title="Medir distancia">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onToggleMeasure}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  measureActive ? "bg-pine/10 text-blaze-deep" : "bg-blaze text-paper"
                }`}
              >
                {measureActive ? "Terminar" : "Medir"}
              </button>
              {measureActive && (
                <span className="flex items-center gap-2 font-mono text-sm text-pine">
                  {dist(measureDistance)}
                  {measurePointsCount > 0 && (
                    <button onClick={onClearMeasure} aria-label="Limpiar medición" className="text-moss">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </span>
              )}
            </div>
            {measureActive && (
              <p className="mt-1.5 text-[11px] text-moss">Tocá el mapa para sumar puntos.</p>
            )}
          </Section>

          {/* Círculos de radio */}
          <Section title="Radio desde tu ubicación">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1 rounded-xl bg-paper/60 px-3 py-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.5"
                  value={radiusValue}
                  onChange={(e) => setRadiusValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRing()}
                  aria-label="Radio en kilómetros"
                  className="w-full bg-transparent text-sm text-pine focus:outline-none"
                />
                <span className="text-xs font-semibold text-moss">km</span>
              </div>
              <button onClick={addRing} className="rounded-xl bg-blaze px-3 py-2 text-sm font-semibold text-paper transition active:scale-95">
                Agregar
              </button>
            </div>
            {!canAddRing && <p className="mt-1.5 text-[11px] text-blaze-deep">Necesito tu ubicación — tocá para activarla.</p>}
            {rings.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {rings.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg bg-paper/50 px-3 py-1.5">
                    <span className="font-mono text-xs text-pine">{r.radiusKm} km</span>
                    <button onClick={() => onRemoveRing(r.id)} aria-label={`Quitar ${r.radiusKm} km`} className="text-moss transition hover:text-blaze">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={onClearRings} className="mt-0.5 w-full rounded-lg py-1.5 text-xs font-medium text-blaze-deep transition hover:bg-pine/5">
                    Quitar todos
                  </button>
                </li>
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
