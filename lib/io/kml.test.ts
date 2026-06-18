import { describe, it, expect } from "vitest";
import { toKml } from "./kml";
import type { Route } from "../types";

const route: Route = {
  waypoints: [
    { lat: 40.4, lng: -3.7 },
    { lat: 40.41, lng: -3.69 },
  ],
  geometry: [
    { lat: 40.4, lng: -3.7, ele: 600 },
    { lat: 40.41, lng: -3.69, ele: 610 },
  ],
  distanceMeters: 1500,
  profile: "bike",
  mode: "auto",
};

describe("toKml", () => {
  it("emits a LineString with lng,lat,ele coordinates", () => {
    const xml = toKml(route, "Ruta");
    expect(xml).toContain("<kml");
    expect(xml).toContain("<LineString>");
    expect(xml).toContain("-3.7,40.4,600");
    expect(xml).toContain("-3.69,40.41,610");
    expect(xml).toContain("<name>Ruta</name>");
  });

  it("escapes XML in the name", () => {
    expect(toKml(route, "A & B")).toContain("A &amp; B");
  });
});
