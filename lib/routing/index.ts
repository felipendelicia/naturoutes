import type { LatLng, Mode, Profile, Route } from "../types";
import { buildManualRoute } from "./manual";
import { fetchBrouterRoute, fetchAlternatives } from "./brouter";

type Deps = {
  fetchRoute?: typeof fetchBrouterRoute;
  fetchAlt?: typeof fetchAlternatives;
};

function emptyRoute(
  waypoints: LatLng[],
  mode: Mode,
  profile: Profile,
): Route {
  return {
    waypoints,
    geometry: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
    distanceMeters: 0,
    profile,
    mode,
  };
}

export async function computeRoute(
  waypoints: LatLng[],
  opts: { mode: Mode; profile: Profile },
  deps: Deps = {},
): Promise<Route> {
  const { mode, profile } = opts;

  if (waypoints.length < 2) return emptyRoute(waypoints, mode, profile);
  if (mode === "manual") return buildManualRoute(waypoints, profile);

  const fetchRoute = deps.fetchRoute ?? fetchBrouterRoute;
  try {
    return await fetchRoute(waypoints, profile);
  } catch {
    return { ...buildManualRoute(waypoints, profile), fallback: true };
  }
}

/**
 * Like computeRoute but returns one or more options. Auto mode returns BRouter
 * alternatives; manual/empty return a single-element array.
 */
export async function computeAlternatives(
  waypoints: LatLng[],
  opts: { mode: Mode; profile: Profile },
  deps: Deps = {},
): Promise<Route[]> {
  const { mode, profile } = opts;

  if (waypoints.length < 2) return [emptyRoute(waypoints, mode, profile)];
  if (mode === "manual") return [buildManualRoute(waypoints, profile)];

  const fetchAlt = deps.fetchAlt ?? fetchAlternatives;
  try {
    return await fetchAlt(waypoints, profile);
  } catch {
    return [{ ...buildManualRoute(waypoints, profile), fallback: true }];
  }
}
