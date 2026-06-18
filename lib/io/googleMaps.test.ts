import { describe, it, expect } from "vitest";
import { directionsUrl } from "./googleMaps";
import type { Route } from "../types";

function routeWith(n: number): Route {
  const waypoints = Array.from({ length: n }, (_, i) => ({
    lat: 40 + i * 0.01,
    lng: -3 - i * 0.01,
  }));
  return {
    waypoints,
    geometry: waypoints,
    distanceMeters: 1000,
    profile: "bike",
    mode: "auto",
  };
}

describe("directionsUrl", () => {
  it("returns '' for fewer than 2 waypoints", () => {
    expect(directionsUrl(routeWith(1), "bike")).toBe("");
  });

  it("builds origin, destination and travelmode for the profile", () => {
    const url = directionsUrl(routeWith(2), "foot");
    expect(url).toContain("origin=40,-3");
    expect(url).toContain("destination=40.01,-3.01");
    expect(url).toContain("travelmode=walking");
    expect(url).not.toContain("waypoints=");
  });

  it("includes middle points as waypoints and uses bicycling for bike", () => {
    const url = directionsUrl(routeWith(3), "bike");
    expect(url).toContain("travelmode=bicycling");
    expect(url).toContain("waypoints=");
  });

  it("caps intermediate waypoints at 9", () => {
    const url = directionsUrl(routeWith(20), "bike");
    const wp = new URL(url).searchParams.get("waypoints") ?? "";
    expect(wp.split("|")).toHaveLength(9);
  });
});
