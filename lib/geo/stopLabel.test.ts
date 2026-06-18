import { describe, it, expect } from "vitest";
import { coordKey, resolveStopLabel } from "./stopLabel";

describe("coordKey", () => {
  it("rounds to a stable 5-decimal key", () => {
    expect(coordKey({ lat: 40.416775, lng: -3.703790 })).toBe("40.41678,-3.70379");
  });
});

describe("resolveStopLabel", () => {
  const cache = { "1.00000,1.00000": "Plaza Mayor" };

  it("labels the origin coord as 'Mi ubicación'", () => {
    expect(resolveStopLabel("9,9", "9,9", cache)).toBe("Mi ubicación");
  });

  it("returns a cached label", () => {
    expect(resolveStopLabel("1.00000,1.00000", null, cache)).toBe("Plaza Mayor");
  });

  it("returns null when unknown", () => {
    expect(resolveStopLabel("2,2", null, cache)).toBeNull();
  });
});
