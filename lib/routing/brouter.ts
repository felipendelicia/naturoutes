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
  alternativeidx = 0,
): Promise<Route> {
  const lonlats = waypoints.map((w) => `${w.lng},${w.lat}`).join("|");
  const url =
    `${ENDPOINT}?lonlats=${lonlats}` +
    `&profile=${brouterProfile(profile)}` +
    `&alternativeidx=${alternativeidx}&format=geojson`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`BRouter respondió ${res.status}`);
  }
  return parseBrouterGeoJSON(await res.json(), waypoints, profile);
}

/**
 * Fetch the main route plus BRouter alternatives (idx 0..3) in parallel,
 * keeping successful, distinct ones. Throws only if none succeed.
 */
export async function fetchAlternatives(
  waypoints: LatLng[],
  profile: Profile,
  fetchImpl: typeof fetch = fetch,
): Promise<Route[]> {
  const results = await Promise.allSettled(
    [0, 1, 2, 3].map((idx) =>
      fetchBrouterRoute(waypoints, profile, fetchImpl, idx),
    ),
  );
  const routes = results
    .filter((r): r is PromiseFulfilledResult<Route> => r.status === "fulfilled")
    .map((r) => r.value);
  const seen = new Set<number>();
  const unique = routes.filter((r) => {
    const key = Math.round(r.distanceMeters);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (unique.length === 0) throw new Error("BRouter no devolvió rutas");
  return unique;
}
