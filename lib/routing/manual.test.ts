import { describe, it, expect } from "vitest";
import { buildManualRoute } from "./manual";
import { totalDistance } from "../geo/haversine";

const wps = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
];

describe("buildManualRoute", () => {
  it("uses waypoints as geometry and haversine total distance", () => {
    const r = buildManualRoute(wps, "bike");
    expect(r.geometry).toEqual(wps);
    expect(r.distanceMeters).toBeCloseTo(totalDistance(wps), 5);
    expect(r.mode).toBe("manual");
    expect(r.profile).toBe("bike");
    expect(r.waypoints).toEqual(wps);
  });

  it("returns zero distance for a single waypoint", () => {
    const r = buildManualRoute([{ lat: 1, lng: 1 }], "foot");
    expect(r.distanceMeters).toBe(0);
  });
});
