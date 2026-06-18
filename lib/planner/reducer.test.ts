import { describe, it, expect } from "vitest";
import { plannerReducer, initialPlannerState } from "./reducer";

const p = { lat: 1, lng: 1 };

describe("plannerReducer", () => {
  it("adds a waypoint", () => {
    const s = plannerReducer(initialPlannerState, { type: "add", point: p });
    expect(s.waypoints).toEqual([p]);
  });

  it("undo removes the last waypoint", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: p });
    s = plannerReducer(s, { type: "add", point: { lat: 2, lng: 2 } });
    s = plannerReducer(s, { type: "undo" });
    expect(s.waypoints).toEqual([p]);
  });

  it("undo on empty is a no-op", () => {
    const s = plannerReducer(initialPlannerState, { type: "undo" });
    expect(s.waypoints).toEqual([]);
  });

  it("clear removes all waypoints but keeps mode/profile", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: p });
    s = plannerReducer(s, { type: "setProfile", profile: "foot" });
    s = plannerReducer(s, { type: "clear" });
    expect(s.waypoints).toEqual([]);
    expect(s.profile).toBe("foot");
  });

  it("sets mode and profile", () => {
    let s = plannerReducer(initialPlannerState, { type: "setMode", mode: "manual" });
    s = plannerReducer(s, { type: "setProfile", profile: "foot" });
    expect(s.mode).toBe("manual");
    expect(s.profile).toBe("foot");
  });

  it("reverse flips waypoint order", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: { lat: 1, lng: 1 } });
    s = plannerReducer(s, { type: "add", point: { lat: 2, lng: 2 } });
    s = plannerReducer(s, { type: "reverse" });
    expect(s.waypoints).toEqual([{ lat: 2, lng: 2 }, { lat: 1, lng: 1 }]);
  });

  it("move replaces the waypoint at an index", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: { lat: 1, lng: 1 } });
    s = plannerReducer(s, { type: "add", point: { lat: 2, lng: 2 } });
    s = plannerReducer(s, { type: "move", index: 1, point: { lat: 9, lng: 9 } });
    expect(s.waypoints[1]).toEqual({ lat: 9, lng: 9 });
  });

  it("insert adds a waypoint at an index", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: { lat: 1, lng: 1 } });
    s = plannerReducer(s, { type: "add", point: { lat: 3, lng: 3 } });
    s = plannerReducer(s, { type: "insert", index: 1, point: { lat: 2, lng: 2 } });
    expect(s.waypoints).toEqual([
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ]);
  });

  it("removeAt removes the waypoint at an index", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: { lat: 1, lng: 1 } });
    s = plannerReducer(s, { type: "add", point: { lat: 2, lng: 2 } });
    s = plannerReducer(s, { type: "removeAt", index: 0 });
    expect(s.waypoints).toEqual([{ lat: 2, lng: 2 }]);
  });

  it("reorder moves a waypoint from one index to another", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: { lat: 1, lng: 1 } });
    s = plannerReducer(s, { type: "add", point: { lat: 2, lng: 2 } });
    s = plannerReducer(s, { type: "add", point: { lat: 3, lng: 3 } });
    s = plannerReducer(s, { type: "reorder", from: 0, to: 2 });
    expect(s.waypoints).toEqual([
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
      { lat: 1, lng: 1 },
    ]);
  });

  it("load replaces waypoints, mode and profile at once", () => {
    const wps = [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
    ];
    const s = plannerReducer(initialPlannerState, {
      type: "load",
      waypoints: wps,
      mode: "manual",
      profile: "foot",
    });
    expect(s.waypoints).toEqual(wps);
    expect(s.mode).toBe("manual");
    expect(s.profile).toBe("foot");
  });
});
