"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { LatLng, Mode, Profile, Route } from "@/lib/types";
import { computeAlternatives } from "@/lib/routing";
import { initialPlannerState, plannerReducer } from "@/lib/planner/reducer";

export function usePlanner() {
  const [state, dispatch] = useReducer(plannerReducer, initialPlannerState);
  const [alternatives, setAlternatives] = useState<Route[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    const t = setTimeout(() => {
      setLoading(true);
      computeAlternatives(state.waypoints, {
        mode: state.mode,
        profile: state.profile,
      })
        .then((rs) => {
          if (id === reqId.current) {
            setAlternatives(rs);
            setSelected(0);
          }
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [state.waypoints, state.mode, state.profile]);

  const route = alternatives[selected] ?? null;

  return {
    state,
    route,
    alternatives,
    selected,
    setSelected,
    loading,
    addWaypoint: (p: LatLng) => dispatch({ type: "add", point: p }),
    undo: () => dispatch({ type: "undo" }),
    clear: () => dispatch({ type: "clear" }),
    setMode: (m: Mode) => dispatch({ type: "setMode", mode: m }),
    setProfile: (p: Profile) => dispatch({ type: "setProfile", profile: p }),
    load: (waypoints: LatLng[], mode: Mode, profile: Profile) =>
      dispatch({ type: "load", waypoints, mode, profile }),
    reverse: () => dispatch({ type: "reverse" }),
    moveWaypoint: (index: number, point: LatLng) =>
      dispatch({ type: "move", index, point }),
    insertWaypoint: (index: number, point: LatLng) =>
      dispatch({ type: "insert", index, point }),
    removeWaypoint: (index: number) => dispatch({ type: "removeAt", index }),
  };
}
