import type { LatLng } from "@/lib/types";

const KEY = "naturoutes:lastLocation";

export function loadLastLocation(): LatLng | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (
      p &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng)
    ) {
      return { lat: p.lat, lng: p.lng };
    }
  } catch {
    /* ignore corrupt value */
  }
  return null;
}

export function saveLastLocation(p: LatLng): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ lat: p.lat, lng: p.lng }));
  } catch {
    /* storage may be unavailable (private mode) */
  }
}
