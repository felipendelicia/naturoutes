"use client";

function fmt(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

export default function MeasureControl({
  active,
  pointsCount,
  distanceMeters,
  onToggle,
  onClear,
}: {
  active: boolean;
  pointsCount: number;
  distanceMeters: number;
  onToggle: () => void;
  onClear: () => void;
}) {
  return (
    <div className="absolute bottom-[19rem] left-3 z-[1000] flex flex-col items-start gap-1">
      {active && pointsCount > 0 && (
        <div className="panel flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-semibold text-pine">
          <span>{fmt(distanceMeters)}</span>
          <button onClick={onClear} aria-label="Limpiar medición" className="text-moss">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      <button
        onClick={onToggle}
        aria-pressed={active}
        aria-label="Medir distancia"
        className={`panel grid h-12 w-12 place-items-center rounded-full transition active:scale-95 ${
          active ? "text-blaze-deep" : "text-pine"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2" y="8" width="20" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 8v3M12 8v4M17 8v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
