import { describe, it, expect } from "vitest";
import { trackStats, buildRecordedRoute, type Fix } from "./recorder";
import { distance } from "../geo/haversine";

// Two points ~111 m apart (0.001 deg lat), then a pause, then move again.
const a: Fix = { lat: 0, lng: 0, ele: 100, t: 0 };
const b: Fix = { lat: 0.001, lng: 0, ele: 110, t: 10_000 }; // ~111m in 10s
const c: Fix = { lat: 0.001, lng: 0, ele: 110, t: 70_000 }; // stopped 60s (no move)
const d: Fix = { lat: 0.002, lng: 0, ele: 105, t: 80_000 }; // ~111m in 10s

describe("trackStats", () => {
  it("returns zeros for fewer than 2 fixes", () => {
    const s = trackStats([a]);
    expect(s.distanceMeters).toBe(0);
    expect(s.durationMs).toBe(0);
  });

  it("sums distance and total duration", () => {
    const s = trackStats([a, b, c, d]);
    expect(s.distanceMeters).toBeCloseTo(
      distance(a, b) + distance(b, c) + distance(c, d),
      3,
    );
    expect(s.durationMs).toBe(80_000);
  });

  it("excludes stopped time from moving time", () => {
    const s = trackStats([a, b, c, d]);
    // moving segments are a→b (10s) and c→d (10s); b→c is stopped
    expect(s.movingMs).toBe(20_000);
    expect(s.avgSpeed).toBeGreaterThan(0);
  });

  it("counts only positive elevation changes as ascent", () => {
    const s = trackStats([a, b, c, d]);
    expect(s.ascentMeters).toBeCloseTo(10, 5); // +10 (a→b), 0, -5 (c→d)
  });
});

describe("buildRecordedRoute", () => {
  it("builds a recorded Route from fixes", () => {
    const r = buildRecordedRoute([a, b, d], "bike");
    expect(r.geometry).toHaveLength(3);
    expect(r.geometry[0]).toEqual({ lat: 0, lng: 0, ele: 100 });
    expect(r.distanceMeters).toBeGreaterThan(0);
    expect(r.profile).toBe("bike");
    expect(r.waypoints).toHaveLength(2);
  });
});
