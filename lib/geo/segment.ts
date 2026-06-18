import type { LatLng } from "../types";

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

function proj(p: LatLng, lat0: number): { x: number; y: number } {
  return {
    x: toRad(p.lng) * Math.cos(toRad(lat0)) * R,
    y: toRad(p.lat) * R,
  };
}

/** Shortest distance (meters) from point p to segment a–b, via local planar projection. */
export function pointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const lat0 = a.lat;
  const P = proj(p, lat0);
  const A = proj(a, lat0);
  const B = proj(b, lat0);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * dx;
  const cy = A.y + t * dy;
  return Math.hypot(P.x - cx, P.y - cy);
}

/** Index i of the segment [points[i], points[i+1]] closest to p. */
export function nearestSegmentIndex(points: LatLng[], p: LatLng): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d = pointToSegmentMeters(p, points[i], points[i + 1]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
