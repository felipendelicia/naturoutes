import { describe, it, expect, vi } from "vitest";
import { buildOverpassQuery, parseOverpass, fetchPois } from "./overpass";
import type { BBox } from "../types";

const bbox: BBox = { south: 40.4, west: -3.71, north: 40.42, east: -3.69 };

describe("buildOverpassQuery", () => {
  it("includes a node filter per kind bounded by the bbox", () => {
    const q = buildOverpassQuery(bbox, ["water", "bicycle_shop"]);
    expect(q).toContain("[out:json]");
    expect(q).toContain('node["amenity"="drinking_water"](40.4,-3.71,40.42,-3.69);');
    expect(q).toContain('node["shop"="bicycle"](40.4,-3.71,40.42,-3.69);');
    expect(q).not.toContain('"amenity"="shelter"');
  });
});

describe("parseOverpass", () => {
  it("maps node elements to Pois with inferred kind", () => {
    const json = {
      elements: [
        { type: "node", id: 1, lat: 40.41, lon: -3.7, tags: { amenity: "drinking_water" } },
        { type: "node", id: 2, lat: 40.415, lon: -3.705, tags: { shop: "bicycle", name: "Bici Shop" } },
        { type: "way", id: 3 },
      ],
    };
    const pois = parseOverpass(json);
    expect(pois).toHaveLength(2);
    expect(pois[0]).toEqual({ id: "1", lat: 40.41, lng: -3.7, kind: "water", name: undefined });
    expect(pois[1].kind).toBe("bicycle_shop");
    expect(pois[1].name).toBe("Bici Shop");
  });
});

describe("fetchPois", () => {
  it("POSTs the query and parses results", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [
          { type: "node", id: 9, lat: 40.41, lon: -3.7, tags: { amenity: "shelter" } },
        ],
      }),
    } as Response);

    const pois = await fetchPois(bbox, ["shelter"], fetchImpl as unknown as typeof fetch);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe("POST");
    expect(pois[0].kind).toBe("shelter");
  });

  it("throws on a non-ok response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response);
    await expect(
      fetchPois(bbox, ["water"], fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});
