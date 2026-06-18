import type { LatLng, Profile, Route, RoutePoint } from "../types";
import { brouterProfile } from "./profiles";

const ENDPOINT = "https://brouter.de/brouter";

type GeoJSONLike = {
  features?: Array<{
    properties?: Record<string, string>;
    geometry?: { coordinates?: number[][] };
  }>;
};

export function parseBrouterGeoJSON(
  json: unknown,
  waypoints: LatLng[],
  profile: Profile,
): Route {
  const data = json as GeoJSONLike;
  const feature = data.features?.[0];
  if (!feature?.geometry?.coordinates) {
    throw new Error("respuesta de BRouter sin geometría");
  }
  const geometry: RoutePoint[] = feature.geometry.coordinates.map(
    ([lng, lat, ele]) => ({ lat, lng, ele }),
  );
  const props = feature.properties ?? {};
  return {
    waypoints,
    geometry,
    distanceMeters: Number(props["track-length"] ?? 0),
    ascentMeters:
      props["filtered ascend"] !== undefined
        ? Number(props["filtered ascend"])
        : undefined,
    profile,
    mode: "auto",
  };
}

export async function fetchBrouterRoute(
  waypoints: LatLng[],
  profile: Profile,
  fetchImpl: typeof fetch = fetch,
): Promise<Route> {
  const lonlats = waypoints.map((w) => `${w.lng},${w.lat}`).join("|");
  const url =
    `${ENDPOINT}?lonlats=${lonlats}` +
    `&profile=${brouterProfile(profile)}` +
    `&alternativeidx=0&format=geojson`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`BRouter respondió ${res.status}`);
  }
  return parseBrouterGeoJSON(await res.json(), waypoints, profile);
}
