import type { Profile, Route, RoutePoint } from "../types";
import { distance } from "../geo/haversine";

export type Fix = { lat: number; lng: number; ele?: number; t: number };

export type TrackStats = {
  distanceMeters: number;
  durationMs: number;
  movingMs: number;
  /** average speed while moving, m/s */
  avgSpeed: number;
  /** max instantaneous speed, m/s */
  maxSpeed: number;
  ascentMeters: number;
};

const MOVING_SPEED = 0.5; // m/s — below this a segment counts as stopped

export function trackStats(fixes: Fix[]): TrackStats {
  const zero: TrackStats = {
    distanceMeters: 0, durationMs: 0, movingMs: 0,
    avgSpeed: 0, maxSpeed: 0, ascentMeters: 0,
  };
  if (fixes.length < 2) return zero;

  let distanceMeters = 0;
  let movingMs = 0;
  let maxSpeed = 0;
  let ascentMeters = 0;

  for (let i = 1; i < fixes.length; i++) {
    const prev = fixes[i - 1];
    const cur = fixes[i];
    const d = distance(prev, cur);
    const dtMs = cur.t - prev.t;
    const speed = dtMs > 0 ? d / (dtMs / 1000) : 0;
    distanceMeters += d;
    maxSpeed = Math.max(maxSpeed, speed);
    if (speed >= MOVING_SPEED) movingMs += dtMs;
    if (prev.ele != null && cur.ele != null && cur.ele > prev.ele) {
      ascentMeters += cur.ele - prev.ele;
    }
  }

  const durationMs = fixes[fixes.length - 1].t - fixes[0].t;
  const avgSpeed = movingMs > 0 ? distanceMeters / (movingMs / 1000) : 0;
  return { distanceMeters, durationMs, movingMs, avgSpeed, maxSpeed, ascentMeters };
}

export function buildRecordedRoute(fixes: Fix[], profile: Profile): Route {
  const geometry: RoutePoint[] = fixes.map((f) => ({
    lat: f.lat,
    lng: f.lng,
    ...(f.ele != null ? { ele: f.ele } : {}),
  }));
  const stats = trackStats(fixes);
  const waypoints =
    fixes.length >= 2
      ? [
          { lat: fixes[0].lat, lng: fixes[0].lng },
          { lat: fixes[fixes.length - 1].lat, lng: fixes[fixes.length - 1].lng },
        ]
      : fixes.map((f) => ({ lat: f.lat, lng: f.lng }));
  return {
    waypoints,
    geometry,
    distanceMeters: stats.distanceMeters,
    ascentMeters: stats.ascentMeters,
    timeSeconds: stats.movingMs / 1000,
    profile,
    mode: "manual",
  };
}
