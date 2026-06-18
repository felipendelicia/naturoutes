import { describe, it, expect, vi } from "vitest";
import {
  parseBrouterGeoJSON,
  fetchBrouterRoute,
  fetchAlternatives,
} from "./brouter";

const sample = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { "track-length": "1500", "filtered ascend": "42" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7, 40.4, 600],
          [-3.69, 40.41, 610],
          [-3.68, 40.42, 605],
        ],
      },
    },
  ],
};

const wps = [
  { lat: 40.4, lng: -3.7 },
  { lat: 40.42, lng: -3.68 },
];

describe("parseBrouterGeoJSON", () => {
  it("maps [lng,lat,ele] coords to RoutePoints", () => {
    const r = parseBrouterGeoJSON(sample, wps, "bike");
    expect(r.geometry[0]).toEqual({ lat: 40.4, lng: -3.7, ele: 600 });
    expect(r.geometry).toHaveLength(3);
  });

  it("reads distance and ascent from properties", () => {
    const r = parseBrouterGeoJSON(sample, wps, "bike");
    expect(r.distanceMeters).toBe(1500);
    expect(r.ascentMeters).toBe(42);
    expect(r.mode).toBe("auto");
    expect(r.waypoints).toEqual(wps);
  });
});

describe("fetchBrouterRoute", () => {
  it("calls BRouter with lonlats + mapped profile and parses the response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    } as Response);

    const r = await fetchBrouterRoute(
      wps,
      "foot",
      fetchImpl as unknown as typeof fetch,
    );

    const url = fetchImpl.mock.calls[0][0] as string;
    expect(url).toContain("lonlats=-3.7,40.4|-3.68,40.42");
    expect(url).toContain("profile=hiking-mountain");
    expect(url).toContain("format=geojson");
    expect(r.distanceMeters).toBe(1500);
  });

  it("throws when the response is not ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(
      fetchBrouterRoute(wps, "bike", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});

function sampleWithLength(len: number) {
  return {
    features: [
      {
        properties: { "track-length": String(len) },
        geometry: {
          coordinates: [
            [-3.7, 40.4, 600],
            [-3.68, 40.42, 605],
          ],
        },
      },
    ],
  };
}

describe("fetchAlternatives", () => {
  it("returns distinct routes across alternativeidx, deduped by distance", async () => {
    const lens: Record<number, number> = { 0: 1000, 1: 1200, 2: 1500, 3: 1200 };
    const fetchImpl = vi.fn(async (url: string) => {
      const idx = Number(new URL(url).searchParams.get("alternativeidx"));
      return { ok: true, json: async () => sampleWithLength(lens[idx]) } as Response;
    });

    const routes = await fetchAlternatives(
      wps,
      "bike",
      fetchImpl as unknown as typeof fetch,
    );
    expect(routes.map((r) => r.distanceMeters)).toEqual([1000, 1200, 1500]);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("throws when no alternative succeeds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(
      fetchAlternatives(wps, "bike", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});
