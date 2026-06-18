import { describe, it, expect } from "vitest";
import { pointToSegmentMeters, nearestSegmentIndex } from "./segment";

describe("pointToSegmentMeters", () => {
  it("is ~0 for a point on the segment", () => {
    const d = pointToSegmentMeters(
      { lat: 0, lng: 0.5 },
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
    );
    expect(d).toBeLessThan(1);
  });

  it("measures perpendicular distance off the segment", () => {
    // ~1 deg lat north of a point on the equator ≈ 111 km
    const d = pointToSegmentMeters(
      { lat: 1, lng: 0.5 },
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
    );
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it("clamps to the nearest endpoint beyond the segment", () => {
    const d = pointToSegmentMeters(
      { lat: 0, lng: 2 },
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
    );
    // distance to endpoint at lng=1, ~111 km
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe("nearestSegmentIndex", () => {
  it("returns the index of the closest segment", () => {
    const pts = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    expect(nearestSegmentIndex(pts, { lat: 0.001, lng: 1.5 })).toBe(1);
    expect(nearestSegmentIndex(pts, { lat: 0.001, lng: 0.5 })).toBe(0);
  });
});
