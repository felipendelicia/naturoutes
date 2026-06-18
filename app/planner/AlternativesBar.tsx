"use client";

import type { Route } from "@/lib/types";

function km(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function AlternativesBar({
  alternatives,
  selected,
  onSelect,
}: {
  alternatives: Route[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  if (alternatives.length < 2) return null;

  return (
    <div className="pointer-events-auto mt-3 flex gap-1.5 overflow-x-auto pb-1">
      {alternatives.map((r, i) => {
        const active = i === selected;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-pressed={active}
            className={`panel shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? "bg-blaze text-paper" : "text-pine"
            }`}
          >
            Opción {i + 1} · {km(r.distanceMeters)}
            {r.ascentMeters != null && r.ascentMeters > 0 && (
              <span className={active ? "text-paper/80" : "text-moss"}>
                {" "}
                ↗{Math.round(r.ascentMeters)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
