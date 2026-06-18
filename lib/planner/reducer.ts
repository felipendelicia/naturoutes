import type { LatLng, Mode, Profile } from "../types";

export type PlannerState = {
  waypoints: LatLng[];
  mode: Mode;
  profile: Profile;
};

export type PlannerAction =
  | { type: "add"; point: LatLng }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "setMode"; mode: Mode }
  | { type: "setProfile"; profile: Profile }
  | { type: "load"; waypoints: LatLng[]; mode: Mode; profile: Profile };

export const initialPlannerState: PlannerState = {
  waypoints: [],
  mode: "auto",
  profile: "bike",
};

export function plannerReducer(
  state: PlannerState,
  action: PlannerAction,
): PlannerState {
  switch (action.type) {
    case "add":
      return { ...state, waypoints: [...state.waypoints, action.point] };
    case "undo":
      return { ...state, waypoints: state.waypoints.slice(0, -1) };
    case "clear":
      return { ...state, waypoints: [] };
    case "setMode":
      return { ...state, mode: action.mode };
    case "setProfile":
      return { ...state, profile: action.profile };
    case "load":
      return {
        waypoints: action.waypoints,
        mode: action.mode,
        profile: action.profile,
      };
  }
}
