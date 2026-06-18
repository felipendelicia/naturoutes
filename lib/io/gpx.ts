import type { LatLng, Route } from "../types";
import { escapeXml } from "./xml";

export function toGpx(route: Route, name = "naturoutes"): string {
  const trkpts = route.geometry
    .map(
      (p) =>
        `<trkpt lat="${p.lat}" lon="${p.lng}">` +
        (p.ele != null ? `<ele>${p.ele}</ele>` : "") +
        `</trkpt>`,
    )
    .join("");
  const rtepts = route.waypoints
    .map((w) => `<rtept lat="${w.lat}" lon="${w.lng}"></rtept>`)
    .join("");
  const n = escapeXml(name);
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="naturoutes" xmlns="http://www.topografix.com/GPX/1/1">` +
    `<metadata><name>${n}</name></metadata>` +
    `<rte>${rtepts}</rte>` +
    `<trk><name>${n}</name><trkseg>${trkpts}</trkseg></trk>` +
    `</gpx>`
  );
}

function extractPoints(xml: string, tag: string): LatLng[] {
  const re = new RegExp(`<${tag}\\b[^>]*>`, "g");
  const pts: LatLng[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const lat = /lat="([^"]+)"/.exec(m[0])?.[1];
    const lon = /lon="([^"]+)"/.exec(m[0])?.[1];
    if (lat && lon) {
      const p = { lat: Number(lat), lng: Number(lon) };
      if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) pts.push(p);
    }
  }
  return pts;
}

export function fromGpx(text: string): { waypoints: LatLng[]; dense: boolean } {
  const rte = extractPoints(text, "rtept");
  if (rte.length >= 2) return { waypoints: rte, dense: false };
  return { waypoints: extractPoints(text, "trkpt"), dense: true };
}
