import type { LatLng, Profile, Route } from "../types";
import { totalDistance } from "../geo/haversine";
import { profileDef } from "./profiles";

export function buildManualRoute(
  waypoints: LatLng[],
  profile: Profile,
): Route {
  const distanceMeters = totalDistance(waypoints);
  const speedMs = (profileDef(profile).speedKmh * 1000) / 3600;
  return {
    waypoints,
    geometry: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
    distanceMeters,
    timeSeconds: speedMs > 0 ? distanceMeters / speedMs : undefined,
    profile,
    mode: "manual",
  };
}
