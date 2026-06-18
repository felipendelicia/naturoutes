import { describe, it, expect } from "vitest";
import { lngLatToTile, tilesForBBox, estimateTiles, tileUrl } from "./tiles";
import type { BBox } from "../types";

describe("lngLatToTile", () => {
  it("returns 0,0 at zoom 0", () => {
    expect(lngLatToTile(-3.7, 40.4, 0)).toEqual({ x: 0, y: 0 });
  });

  it("places the far north-west corner at tile 0,0", () => {
    expect(lngLatToTile(-180, 85, 2)).toEqual({ x: 0, y: 0 });
  });

  it("places eastern longitudes at higher x", () => {
    const west = lngLatToTile(-100, 0, 4).x;
    const east = lngLatToTile(100, 0, 4).x;
    expect(east).toBeGreaterThan(west);
  });
});

const bbox: BBox = { south: 40.40, west: -3.72, north: 40.43, east: -3.68 };

describe("tilesForBBox / estimateTiles", () => {
  it("produces tiles across the zoom range", () => {
    const tiles = tilesForBBox(bbox, 12, 13);
    const zooms = new Set(tiles.map((t) => t.z));
    expect(zooms.has(12)).toBe(true);
    expect(zooms.has(13)).toBe(true);
  });

  it("estimateTiles matches the produced count", () => {
    expect(estimateTiles(bbox, 12, 14)).toBe(tilesForBBox(bbox, 12, 14).length);
  });
});

describe("tileUrl", () => {
  it("substitutes z/x/y and subdomain", () => {
    const u = tileUrl(
      "https://{s}.tile.example/{z}/{x}/{y}.png",
      { z: 13, x: 10, y: 20 },
      "a",
    );
    expect(u).toBe("https://a.tile.example/13/10/20.png");
  });

  it("works without a subdomain placeholder", () => {
    const u = tileUrl("https://t.ex/{z}/{x}/{y}", { z: 1, x: 2, y: 3 });
    expect(u).toBe("https://t.ex/1/2/3");
  });
});
