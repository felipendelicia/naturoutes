import { describe, it, expect } from "vitest";
import { BASE_LAYERS, layerById } from "./layers";

describe("BASE_LAYERS", () => {
  it("includes street, satellite, relief and cycle layers", () => {
    const ids = BASE_LAYERS.map((l) => l.id);
    expect(ids).toContain("osm");
    expect(ids).toContain("sat");
    expect(ids).toContain("topo");
    expect(ids).toContain("cycle");
  });

  it("every layer has a url with tile placeholders and an attribution", () => {
    for (const l of BASE_LAYERS) {
      expect(l.url).toMatch(/\{z\}/);
      expect(l.url).toMatch(/\{x\}/);
      expect(l.url).toMatch(/\{y\}/);
      expect(l.attribution.length).toBeGreaterThan(0);
      expect(l.maxZoom).toBeGreaterThan(0);
    }
  });
});

describe("layerById", () => {
  it("returns the matching layer", () => {
    expect(layerById("sat").id).toBe("sat");
  });
  it("falls back to osm for unknown ids", () => {
    expect(layerById("nope").id).toBe("osm");
  });
});
