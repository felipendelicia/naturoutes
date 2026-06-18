"use client";

import { useMemo } from "react";
import type { Route } from "@/lib/types";
import { elevationProfile, buildElevationPaths } from "@/lib/geo/elevation";

const W = 100;
const H = 40;

export default function ElevationProfile({ route }: { route: Route | null }) {
  const data = useMemo(
    () => (route ? elevationProfile(route.geometry) : null),
    [route],
  );

  if (!data || data.points.length < 2) return null;

  const { line, area } = buildElevationPaths(data, W, H);

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-moss">
        <span>Altimetría</span>
        <span className="font-mono">
          {Math.round(data.min)}–{Math.round(data.max)} m
        </span>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-pine/5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-12 w-full"
          aria-hidden
        >
          <path d={area} fill="var(--moss)" fillOpacity={0.18} />
          <path
            d={line}
            fill="none"
            stroke="var(--blaze)"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
