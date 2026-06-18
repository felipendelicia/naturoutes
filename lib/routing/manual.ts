import type { LatLng, Profile, Route } from "../types";
import { totalDistance } from "../geo/haversine";

export function buildManualRoute(
  waypoints: LatLng[],
  profile: Profile,
): Route {
  return {
    waypoints,
    geometry: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
    distanceMeters: totalDistance(waypoints),
    profile,
    mode: "manual",
  };
}
