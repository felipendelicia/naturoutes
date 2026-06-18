export type LatLng = { lat: number; lng: number };
export type RoutePoint = LatLng & { ele?: number };
export type Profile = "bike" | "mtb" | "foot";
export type Mode = "auto" | "manual";

export type SurfaceSummary = {
  pavedMeters: number;
  unpavedMeters: number;
  unknownMeters: number;
  /** paved / (paved + unpaved); null when no surface info is known */
  pavedRatio: number | null;
};

export type Route = {
  waypoints: LatLng[];
  geometry: RoutePoint[];
  distanceMeters: number;
  ascentMeters?: number;
  timeSeconds?: number;
  surface?: SurfaceSummary;
  profile: Profile;
  mode: Mode;
  /** true when an auto route fell back to a straight line */
  fallback?: boolean;
};
