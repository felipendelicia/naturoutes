import type { Route } from "../types";
import { escapeXml } from "./xml";

export function toKml(route: Route, name = "naturoutes"): string {
  const coords = route.geometry
    .map((p) => `${p.lng},${p.lat}${p.ele != null ? `,${p.ele}` : ""}`)
    .join(" ");
  const n = escapeXml(name);
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${n}</name>` +
    `<Placemark><name>${n}</name>` +
    `<LineString><tessellate>1</tessellate><coordinates>${coords}</coordinates></LineString>` +
    `</Placemark></Document></kml>`
  );
}
