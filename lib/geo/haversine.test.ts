import { describe, it, expect } from "vitest";
import { distance, totalDistance } from "./haversine";

describe("distance", () => {
  it("returns 0 for the same point", () => {
    expect(distance({ lat: 40, lng: -3 }, { lat: 40, lng: -3 })).toBe(0);
  });

  it("approximates 1 degree of latitude as ~111 km", () => {
    const d = distance({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe("totalDistance", () => {
  it("returns 0 for fewer than 2 points", () => {
    expect(totalDistance([])).toBe(0);
    expect(totalDistance([{ lat: 1, lng: 1 }])).toBe(0);
  });

  it("sums segment distances", () => {
    const pts = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    const expected = distance(pts[0], pts[1]) + distance(pts[1], pts[2]);
    expect(totalDistance(pts)).toBeCloseTo(expected, 5);
  });
});
