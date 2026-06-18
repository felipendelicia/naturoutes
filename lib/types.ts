export type LatLng = { lat: number; lng: number };
export type RoutePoint = LatLng & { ele?: number };
export type Profile = "bike" | "bike-fast" | "mtb" | "gravel" | "foot";
export type Mode = "auto" | "manual";

export type Route = {
  waypoints: LatLng[];
  geometry: RoutePoint[];
  distanceMeters: number;
  ascentMeters?: number;
  profile: Profile;
  mode: Mode;
  /** true when an auto route fell back to a straight line */
  fallback?: boolean;
};
