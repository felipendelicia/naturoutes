import { describe, it, expect } from "vitest";
import { summarizeSurface } from "./surface";

const header = [
  "Longitude", "Latitude", "Elevation", "Distance", "CostPerKm",
  "ElevCost", "TurnCost", "NodeCost", "InitialCost", "WayTags", "NodeTags",
];

function row(distance: number, wayTags: string): string[] {
  const r = new Array(11).fill("");
  r[3] = String(distance);
  r[9] = wayTags;
  return r;
}

describe("summarizeSurface", () => {
  it("returns null ratio when there are no rows", () => {
    expect(summarizeSurface([header]).pavedRatio).toBeNull();
  });

  it("buckets distance by paved vs unpaved surface tags", () => {
    const messages = [
      header,
      row(100, "highway=residential surface=asphalt"),
      row(300, "highway=track surface=gravel"),
      row(100, "highway=path surface=ground"),
    ];
    const s = summarizeSurface(messages);
    expect(s.pavedMeters).toBe(100);
    expect(s.unpavedMeters).toBe(400);
    expect(s.pavedRatio).toBeCloseTo(100 / 500, 5);
  });

  it("counts segments without a surface tag as unknown", () => {
    const messages = [header, row(200, "highway=residential")];
    const s = summarizeSurface(messages);
    expect(s.unknownMeters).toBe(200);
    expect(s.pavedRatio).toBeNull();
  });
});
