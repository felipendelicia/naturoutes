import type { LatLng, Mode, Profile, Route } from "../types";
import { buildManualRoute } from "./manual";
import { fetchBrouterRoute } from "./brouter";

type Deps = { fetchRoute?: typeof fetchBrouterRoute };

export async function computeRoute(
  waypoints: LatLng[],
  opts: { mode: Mode; profile: Profile },
  deps: Deps = {},
): Promise<Route> {
  const { mode, profile } = opts;

  if (waypoints.length < 2) {
    return {
      waypoints,
      geometry: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
      distanceMeters: 0,
      profile,
      mode,
    };
  }

  if (mode === "manual") {
    return buildManualRoute(waypoints, profile);
  }

  const fetchRoute = deps.fetchRoute ?? fetchBrouterRoute;
  try {
    return await fetchRoute(waypoints, profile);
  } catch {
    return { ...buildManualRoute(waypoints, profile), fallback: true };
  }
}
