"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { LatLng, Mode, Profile, Route } from "@/lib/types";
import { computeRoute } from "@/lib/routing";
import { initialPlannerState, plannerReducer } from "@/lib/planner/reducer";

export function usePlanner() {
  const [state, dispatch] = useReducer(plannerReducer, initialPlannerState);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      computeRoute(state.waypoints, {
        mode: state.mode,
        profile: state.profile,
      })
        .then((r) => {
          if (id === reqId.current) setRoute(r);
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [state.waypoints, state.mode, state.profile]);

  return {
    state,
    route,
    loading,
    addWaypoint: (p: LatLng) => dispatch({ type: "add", point: p }),
    undo: () => dispatch({ type: "undo" }),
    clear: () => dispatch({ type: "clear" }),
    setMode: (m: Mode) => dispatch({ type: "setMode", mode: m }),
    setProfile: (p: Profile) => dispatch({ type: "setProfile", profile: p }),
  };
}
