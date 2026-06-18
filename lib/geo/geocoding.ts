export type Place = { lat: number; lng: number; label: string };

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

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
