import type { RoutePoint } from "../types";
import { distance } from "./haversine";

export type ElevationPoint = { d: number; ele: number };

export type ElevationProfileData = {
  points: ElevationPoint[];
  min: number;
  max: number;
  totalDistance: number;
};

const EMPTY: ElevationProfileData = {
  points: [],
  min: 0,
  max: 0,
  totalDistance: 0,
};

function hasEle(p: RoutePoint): p is RoutePoint & { ele: number } {
  return typeof p.ele === "number";
}

export function elevationProfile(
  geometry: RoutePoint[],
): ElevationProfileData {
  if (geometry.length < 2 || !geometry.every(hasEle)) {
    return EMPTY;
  }

  const points: ElevationPoint[] = [];
  let cumulative = 0;
  let min = Infinity;
  let max = -Infinity;

  geometry.forEach((p, i) => {
    if (i > 0) cumulative += distance(geometry[i - 1], p);
    const ele = p.ele as number;
    min = Math.min(min, ele);
    max = Math.max(max, ele);
    points.push({ d: cumulative, ele });
  });

  return { points, min, max, totalDistance: cumulative };
}

/** Index of the elevation point whose cumulative distance is closest to `target`. */
export function indexAtDistance(
  points: ElevationPoint[],
  target: number,
): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = Math.abs(points[i].d - target);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildElevationPaths(
  profile: ElevationProfileData,
  width: number,
  height: number,
): { line: string; area: string } {
  const { points, min, max, totalDistance } = profile;
  if (points.length < 2 || totalDistance === 0) {
    return { line: "", area: "" };
  }

  const span = max - min;
  const xy = points.map((p) => {
    const x = round((p.d / totalDistance) * width);
    const y =
      span === 0
        ? round(height / 2)
        : round(height - ((p.ele - min) / span) * height);
    return `${x},${y}`;
  });

  const line = `M${xy.join(" L")}`;
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area };
}
