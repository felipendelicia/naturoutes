import { describe, it, expect, vi } from "vitest";
import { computeRoute, computeAlternatives } from "./index";

const wps = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
];

describe("computeRoute", () => {
  it("returns an empty route for fewer than 2 waypoints", async () => {
    const r = await computeRoute([{ lat: 0, lng: 0 }], {
      mode: "auto",
      profile: "bike",
    });
    expect(r.distanceMeters).toBe(0);
    expect(r.geometry).toHaveLength(1);
  });

  it("uses manual builder in manual mode", async () => {
    const fetchRoute = vi.fn();
    const r = await computeRoute(
      wps,
      { mode: "manual", profile: "bike" },
      { fetchRoute },
    );
    expect(r.mode).toBe("manual");
    expect(fetchRoute).not.toHaveBeenCalled();
  });

  it("uses the auto router in auto mode", async () => {
    const fetchRoute = vi.fn().mockResolvedValue({
      waypoints: wps,
      geometry: wps,
      distanceMeters: 999,
      profile: "bike",
      mode: "auto",
    });
    const r = await computeRoute(
      wps,
      { mode: "auto", profile: "bike" },
      { fetchRoute },
    );
    expect(r.distanceMeters).toBe(999);
    expect(fetchRoute).toHaveBeenCalledOnce();
  });

  it("falls back to a manual line when the auto router throws", async () => {
    const fetchRoute = vi.fn().mockRejectedValue(new Error("down"));
    const r = await computeRoute(
      wps,
      { mode: "auto", profile: "bike" },
      { fetchRoute },
    );
    expect(r.mode).toBe("manual");
    expect(r.fallback).toBe(true);
    expect(r.distanceMeters).toBeGreaterThan(0);
  });
});

describe("computeAlternatives", () => {
  it("returns a single manual route in manual mode", async () => {
    const fetchAlt = vi.fn();
    const rs = await computeAlternatives(
      wps,
      { mode: "manual", profile: "bike" },
      { fetchAlt },
    );
    expect(rs).toHaveLength(1);
    expect(rs[0].mode).toBe("manual");
    expect(fetchAlt).not.toHaveBeenCalled();
  });

  it("returns BRouter alternatives in auto mode", async () => {
    const fetchAlt = vi.fn().mockResolvedValue([
      { waypoints: wps, geometry: wps, distanceMeters: 100, profile: "bike", mode: "auto" },
      { waypoints: wps, geometry: wps, distanceMeters: 120, profile: "bike", mode: "auto" },
    ]);
    const rs = await computeAlternatives(
      wps,
      { mode: "auto", profile: "bike" },
      { fetchAlt },
    );
    expect(rs).toHaveLength(2);
  });

  it("falls back to a single manual line when alternatives fail", async () => {
    const fetchAlt = vi.fn().mockRejectedValue(new Error("down"));
    const rs = await computeAlternatives(
      wps,
      { mode: "auto", profile: "bike" },
      { fetchAlt },
    );
    expect(rs).toHaveLength(1);
    expect(rs[0].fallback).toBe(true);
  });
});
