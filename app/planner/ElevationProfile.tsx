"use client";

import { useMemo, useState } from "react";
import type { Route, RoutePoint } from "@/lib/types";
import {
  elevationProfile,
  buildElevationPaths,
  indexAtDistance,
} from "@/lib/geo/elevation";

const W = 100;
const H = 40;

export default function ElevationProfile({
  route,
  onHover,
}: {
  route: Route | null;
  onHover?: (p: RoutePoint | null) => void;
}) {
  const data = useMemo(
    () => (route ? elevationProfile(route.geometry) : null),
    [route],
  );
  const [hover, setHover] = useState<{ x: number; ele: number } | null>(null);

  if (!route || !data || data.points.length < 2) return null;

  const { line, area } = buildElevationPaths(data, W, H);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!data || !route) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const i = indexAtDistance(data.points, f * data.totalDistance);
    const pt = route.geometry[i];
    setHover({ x: (data.points[i].d / data.totalDistance) * W, ele: data.points[i].ele });
    onHover?.(pt);
  }

  function handleLeave() {
    setHover(null);
    onHover?.(null);
  }

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-moss">
        <span>Altimetría</span>
        <span className="font-mono">
          {hover ? `${Math.round(hover.ele)} m` : `${Math.round(data.min)}–${Math.round(data.max)} m`}
        </span>
      </div>
      <div
        className="relative touch-none overflow-hidden rounded-xl bg-pine/5"
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={handleLeave}
        onPointerUp={handleLeave}
      >
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
          {hover && (
            <line
              x1={hover.x}
              y1={0}
              x2={hover.x}
              y2={H}
              stroke="var(--pine)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
