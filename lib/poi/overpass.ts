import type { BBox } from "../types";

export type PoiKind = "water" | "shelter" | "bicycle_parking" | "bicycle_shop";
export type Poi = {
  id: string;
  lat: number;
  lng: number;
  kind: PoiKind | "other";
  name?: string;
};

const FILTERS: Record<PoiKind, string> = {
  water: 'node["amenity"="drinking_water"]',
  shelter: 'node["amenity"="shelter"]',
  bicycle_parking: 'node["amenity"="bicycle_parking"]',
  bicycle_shop: 'node["shop"="bicycle"]',
};

// Kumi mirror accepts a raw-body POST reliably (the main endpoint is flaky with it).
const ENDPOINT = "https://overpass.kumi.systems/api/interpreter";

export function buildOverpassQuery(bbox: BBox, kinds: PoiKind[]): string {
  const b = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
  const body = kinds.map((k) => `${FILTERS[k]}${b};`).join("");
  return `[out:json][timeout:25];(${body});out body 300;`;
}

type OverpassTags = Record<string, string>;

function kindOf(tags: OverpassTags): PoiKind | "other" {
  if (tags.amenity === "drinking_water") return "water";
  if (tags.amenity === "shelter") return "shelter";
  if (tags.amenity === "bicycle_parking") return "bicycle_parking";
  if (tags.shop === "bicycle") return "bicycle_shop";
  return "other";
}

type OverpassNode = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: OverpassTags;
};

export function parseOverpass(json: unknown): Poi[] {
  const elements = (json as { elements?: OverpassNode[] }).elements ?? [];
  return elements
    .filter(
      (e) =>
        e.type === "node" &&
        Number.isFinite(e.lat) &&
        Number.isFinite(e.lon),
    )
    .map((e) => {
      const tags = e.tags ?? {};
      return {
        id: String(e.id),
        lat: e.lat as number,
        lng: e.lon as number,
        kind: kindOf(tags),
        name: tags.name,
      };
    });
}

export async function fetchPois(
  bbox: BBox,
  kinds: PoiKind[],
  fetchImpl: typeof fetch = fetch,
): Promise<Poi[]> {
  const res = await fetchImpl(ENDPOINT, {
    method: "POST",
    body: buildOverpassQuery(bbox, kinds),
  });
  if (!res.ok) throw new Error(`Overpass respondió ${res.status}`);
  return parseOverpass(await res.json());
}
