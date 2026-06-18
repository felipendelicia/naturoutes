import { describe, it, expect } from "vitest";
import { toGpx, fromGpx } from "./gpx";
import type { Route } from "../types";

const route: Route = {
  waypoints: [
    { lat: 40.4, lng: -3.7 },
    { lat: 40.41, lng: -3.69 },
  ],
  geometry: [
    { lat: 40.4, lng: -3.7, ele: 600 },
    { lat: 40.405, lng: -3.695, ele: 605 },
    { lat: 40.41, lng: -3.69, ele: 610 },
  ],
  distanceMeters: 1500,
  profile: "bike",
  mode: "auto",
};

describe("toGpx", () => {
  it("emits a gpx with track points (with ele) and route points", () => {
    const xml = toGpx(route, "Mi ruta");
    expect(xml).toContain("<gpx");
    expect(xml).toContain('<trkpt lat="40.4" lon="-3.7">');
    expect(xml).toContain("<ele>600</ele>");
    expect(xml).toContain('<rtept lat="40.41" lon="-3.69">');
    expect(xml).toContain("<name>Mi ruta</name>");
  });

  it("escapes XML in the name", () => {
    expect(toGpx(route, "A & B")).toContain("A &amp; B");
  });
});

describe("fromGpx", () => {
  it("round-trips our own waypoints from rtept", () => {
    const parsed = fromGpx(toGpx(route, "x"));
    expect(parsed.dense).toBe(false);
    expect(parsed.waypoints).toEqual(route.waypoints);
  });

  it("falls back to dense trkpt when no rtept is present", () => {
    const xml =
      '<gpx><trk><trkseg>' +
      '<trkpt lat="1" lon="2"></trkpt><trkpt lat="3" lon="4"></trkpt>' +
      "</trkseg></trk></gpx>";
    const parsed = fromGpx(xml);
    expect(parsed.dense).toBe(true);
    expect(parsed.waypoints).toEqual([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ]);
  });
});
