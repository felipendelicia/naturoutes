import type { LatLng } from "../types";

export type Place = { lat: number; lng: number; label: string };

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REVERSE = "https://nominatim.openstreetmap.org/reverse";

type NominatimItem = { lat: string; lon: string; display_name: string };

export function parseNominatim(json: unknown): Place[] {
  if (!Array.isArray(json)) return [];
  return (json as NominatimItem[])
    .map((it) => ({
      lat: Number(it.lat),
      lng: Number(it.lon),
      label: it.display_name,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

export async function searchPlaces(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Place[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `${ENDPOINT}?format=json&addressdetails=0&limit=5` +
    `&q=${encodeURIComponent(q)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Nominatim respondió ${res.status}`);
  }
  return parseNominatim(await res.json());
}

type ReverseResult = {
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
};

/** Build a short, human label from a Nominatim reverse-geocode result. */
export function parseReverse(json: unknown): string | null {
  const r = json as ReverseResult;
  const a = r.address ?? {};
  const primary =
    r.name ||
    a.road ||
    a.pedestrian ||
    a.footway ||
    a.cycleway ||
    a.path ||
    a.square ||
    a.neighbourhood;
  const area =
    a.suburb || a.neighbourhood || a.village || a.town || a.city || a.municipality;
  const parts = [primary, area].filter(
    (x, i, arr): x is string => Boolean(x) && arr.indexOf(x) === i,
  );
  if (parts.length) return parts.join(", ");
  if (r.display_name) {
    return r.display_name.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
  }
  return null;
}

export async function reverseGeocode(
  p: LatLng,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const url =
    `${REVERSE}?format=json&addressdetails=1&zoom=16` +
    `&lat=${p.lat}&lon=${p.lng}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Nominatim reverse ${res.status}`);
  return parseReverse(await res.json());
}
