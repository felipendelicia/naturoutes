import { describe, it, expect } from "vitest";
import { elevationProfile, buildElevationPaths } from "./elevation";
import type { RoutePoint } from "../types";

const flat3: RoutePoint[] = [
  { lat: 0, lng: 0, ele: 100 },
  { lat: 0, lng: 0.001, ele: 110 },
  { lat: 0, lng: 0.002, ele: 120 },
];

describe("elevationProfile", () => {
  it("returns an empty profile when fewer than 2 points have elevation", () => {
    const p = elevationProfile([{ lat: 0, lng: 0 }]);
    expect(p.points).toHaveLength(0);
  });

  it("returns an empty profile when any point lacks elevation", () => {
    const p = elevationProfile([
      { lat: 0, lng: 0, ele: 100 },
      { lat: 0, lng: 0.001 },
    ]);
    expect(p.points).toHaveLength(0);
  });

  it("builds a cumulative distance vs elevation series", () => {
    const p = elevationProfile(flat3);
    expect(p.points).toHaveLength(3);
    expect(p.points[0].d).toBe(0);
    expect(p.points[2].d).toBeGreaterThan(p.points[1].d);
    expect(p.min).toBe(100);
    expect(p.max).toBe(120);
    expect(p.totalDistance).toBeCloseTo(p.points[2].d, 5);
  });
});

describe("buildElevationPaths", () => {
  it("maps the series into SVG line and area paths", () => {
    const profile = elevationProfile(flat3);
    const { line, area } = buildElevationPaths(profile, 100, 40);
    expect(line.startsWith("M")).toBe(true);
    expect(line).toContain("0,40"); // first point at min elevation -> bottom
    expect(line).toContain("100,0"); // last point at max elevation -> top
    expect(area.endsWith("Z")).toBe(true);
    expect(area).toContain("L0,40");
  });

  it("draws a flat mid-line when elevation is constant", () => {
    const profile = elevationProfile([
      { lat: 0, lng: 0, ele: 50 },
      { lat: 0, lng: 0.001, ele: 50 },
    ]);
    const { line } = buildElevationPaths(profile, 100, 40);
    expect(line).toContain("0,20");
    expect(line).toContain("100,20");
  });

  it("returns empty paths for an empty profile", () => {
    const profile = elevationProfile([{ lat: 0, lng: 0 }]);
    const { line, area } = buildElevationPaths(profile, 100, 40);
    expect(line).toBe("");
    expect(area).toBe("");
  });
});
