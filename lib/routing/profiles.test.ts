import { describe, it, expect } from "vitest";
import { PROFILES, profileDef, brouterProfile } from "./profiles";
import type { Profile } from "../types";

const ALL: Profile[] = ["bike", "bike-fast", "mtb", "gravel", "foot"];

describe("PROFILES", () => {
  it("has a definition for every Profile id", () => {
    expect(PROFILES.map((p) => p.id).sort()).toEqual([...ALL].sort());
  });

  it("every def has a non-empty label, brouter profile and travel mode", () => {
    for (const p of PROFILES) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.brouter.length).toBeGreaterThan(0);
      expect(["bicycling", "walking"]).toContain(p.travel);
      expect(p.speedKmh).toBeGreaterThan(0);
    }
  });
});

describe("profileDef / brouterProfile", () => {
  it("maps known ids", () => {
    expect(brouterProfile("bike")).toBe("trekking");
    expect(brouterProfile("foot")).toBe("hiking-mountain");
    expect(profileDef("mtb").travel).toBe("bicycling");
    expect(profileDef("foot").travel).toBe("walking");
  });
});
