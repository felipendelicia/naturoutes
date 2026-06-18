import { describe, it, expect, vi } from "vitest";
import { parseNominatim, searchPlaces } from "./geocoding";

const sample = [
  {
    lat: "40.4167",
    lon: "-3.7038",
    display_name: "Madrid, España",
  },
  {
    lat: "41.3874",
    lon: "2.1686",
    display_name: "Barcelona, España",
  },
];

describe("parseNominatim", () => {
  it("maps lat/lon strings to numbers and display_name to label", () => {
    const places = parseNominatim(sample);
    expect(places).toHaveLength(2);
    expect(places[0]).toEqual({
      lat: 40.4167,
      lng: -3.7038,
      label: "Madrid, España",
    });
  });

  it("ignores entries with invalid coordinates", () => {
    const places = parseNominatim([{ lat: "x", lon: "y", display_name: "Bad" }]);
    expect(places).toHaveLength(0);
  });
});

describe("searchPlaces", () => {
  it("returns [] for an empty query without calling fetch", async () => {
    const fetchImpl = vi.fn();
    expect(await searchPlaces("   ", fetchImpl as unknown as typeof fetch)).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls Nominatim with an encoded query and parses results", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    } as Response);

    const places = await searchPlaces(
      "Plaza Mayor",
      fetchImpl as unknown as typeof fetch,
    );

    const url = fetchImpl.mock.calls[0][0] as string;
    expect(url).toContain("format=json");
    expect(url).toContain("q=Plaza%20Mayor");
    expect(places[1].label).toBe("Barcelona, España");
  });

  it("throws when the response is not ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response);
    await expect(
      searchPlaces("Madrid", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});
