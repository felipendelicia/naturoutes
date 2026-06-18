import type { LatLng } from "../types";

/** Stable key for a coordinate, used to cache labels and tag the origin. */
export function coordKey(p: LatLng): string {
  return `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
}

/** "Mi ubicación" for the GPS origin, a cached reverse-geocoded name, else null. */
export function resolveStopLabel(
  key: string,
  originKey: string | null,
  cache: Record<string, string>,
): string | null {
  if (originKey && key === originKey) return "Mi ubicación";
  return cache[key] ?? null;
}
