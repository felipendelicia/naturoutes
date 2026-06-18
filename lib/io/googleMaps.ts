import type { LatLng, Profile, Route } from "../types";
import { profileDef } from "../routing/profiles";

const MAX_WAYPOINTS = 9;

function fmt(p: LatLng): string {
  return `${p.lat},${p.lng}`;
}

export function directionsUrl(route: Route, profile: Profile): string {
  const wps = route.waypoints;
  if (wps.length < 2) return "";

  const origin = fmt(wps[0]);
  const destination = fmt(wps[wps.length - 1]);
  const travelmode = profileDef(profile).travel;

  let middle = wps.slice(1, -1);
  if (middle.length > MAX_WAYPOINTS) {
    // Evenly sample down to the API's waypoint limit.
    const step = middle.length / MAX_WAYPOINTS;
    middle = Array.from(
      { length: MAX_WAYPOINTS },
      (_, i) => middle[Math.floor(i * step)],
    );
  }

  let url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${origin}&destination=${destination}&travelmode=${travelmode}`;
  if (middle.length) {
    url += `&waypoints=${middle.map(fmt).join("|")}`;
  }
  return url;
}
