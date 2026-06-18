"use client";

import { useRecorder } from "./useRecorder";
import { buildRecordedRoute } from "@/lib/tracking/recorder";
import type { Profile, Route } from "@/lib/types";

function dist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function RecorderControl({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (route: Route, name: string) => void;
}) {
  const rec = useRecorder();
  const active = rec.status !== "idle";

  function handleStop() {
    const fixes = rec.stop();
    if (fixes.length >= 2) {
      const name = window.prompt(
        "Nombre del recorrido grabado:",
        `Salida ${new Date().toLocaleDateString("es")}`,
      );
      if (name && name.trim()) {
        onSave(buildRecordedRoute(fixes, profile), name.trim());
      }
    }
    rec.reset();
  }

  return (
    <>
      {/* Live stats while recording */}
      {active && (
        <div className="animate-drop pointer-events-none absolute left-1/2 top-20 z-[1000] -translate-x-1/2">
          <div className="panel pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              {rec.status === "recording" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blaze opacity-70" />
              )}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blaze" />
            </span>
            <span className="font-mono text-sm font-semibold text-pine">
              {dist(rec.stats.distanceMeters)}
            </span>
            <span className="font-mono text-sm text-pine-soft">
              {clock(rec.stats.movingMs)}
            </span>
            <span className="font-mono text-sm text-moss">
              {(rec.stats.avgSpeed * 3.6).toFixed(1)} km/h
            </span>
          </div>
          {rec.error && (
            <p className="mt-1 text-center text-[11px] text-blaze-deep">{rec.error}</p>
          )}
        </div>
      )}

      {/* Record / pause / stop buttons (stacked above the GPS button) */}
      <div className="absolute bottom-60 right-3 z-[1000] flex flex-col items-center gap-2">
        {rec.status === "idle" && (
          <button
            onClick={rec.start}
            aria-label="Grabar recorrido"
            className="panel grid h-12 w-12 place-items-center rounded-full transition active:scale-95"
          >
            <span className="h-4 w-4 rounded-full bg-blaze" />
          </button>
        )}

        {active && (
          <>
            <button
              onClick={handleStop}
              aria-label="Terminar y guardar"
              className="panel grid h-12 w-12 place-items-center rounded-full transition active:scale-95"
            >
              <span className="h-3.5 w-3.5 rounded-[3px] bg-pine" />
            </button>
            <button
              onClick={rec.status === "recording" ? rec.pause : rec.resume}
              aria-label={rec.status === "recording" ? "Pausar" : "Reanudar"}
              className="panel grid h-10 w-10 place-items-center rounded-full text-pine transition active:scale-95"
            >
              {rec.status === "recording" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 5l12 7-12 7V5z" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}
