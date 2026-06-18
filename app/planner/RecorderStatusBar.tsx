"use client";

import type { useRecorder } from "./useRecorder";

type Recorder = ReturnType<typeof useRecorder>;

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

export default function RecorderStatusBar({ recorder }: { recorder: Recorder }) {
  if (recorder.status === "idle") return null;
  return (
    <div className="animate-drop pointer-events-none absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
      <div className="panel pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2">
        <span className="relative flex h-2.5 w-2.5">
          {recorder.status === "recording" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blaze opacity-70" />
          )}
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blaze" />
        </span>
        <span className="font-mono text-sm font-semibold text-pine">{dist(recorder.stats.distanceMeters)}</span>
        <span className="font-mono text-sm text-pine-soft">{clock(recorder.stats.movingMs)}</span>
        <span className="font-mono text-sm text-moss">{(recorder.stats.avgSpeed * 3.6).toFixed(1)} km/h</span>
      </div>
    </div>
  );
}
