import type { BBox } from "../types";

export type Tile = { z: number; x: number; y: number };

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lngLatToTile(lng: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n,
  );
  return { x: clamp(x, 0, n - 1), y: clamp(y, 0, n - 1) };
}

function range(bbox: BBox, z: number) {
  const tl = lngLatToTile(bbox.west, bbox.north, z);
  const br = lngLatToTile(bbox.east, bbox.south, z);
  return {
    x0: Math.min(tl.x, br.x),
    x1: Math.max(tl.x, br.x),
    y0: Math.min(tl.y, br.y),
    y1: Math.max(tl.y, br.y),
  };
}

export function tilesForBBox(
  bbox: BBox,
  minZoom: number,
  maxZoom: number,
): Tile[] {
  const tiles: Tile[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const { x0, x1, y0, y1 } = range(bbox, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

export function estimateTiles(
  bbox: BBox,
  minZoom: number,
  maxZoom: number,
): number {
  let count = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    const { x0, x1, y0, y1 } = range(bbox, z);
    count += (x1 - x0 + 1) * (y1 - y0 + 1);
  }
  return count;
}

export function tileUrl(template: string, t: Tile, subdomain = "a"): string {
  return template
    .replace("{s}", subdomain)
    .replace("{z}", String(t.z))
    .replace("{x}", String(t.x))
    .replace("{y}", String(t.y));
}
