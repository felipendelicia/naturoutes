import type { SurfaceSummary } from "../types";

const PAVED = new Set([
  "asphalt", "paved", "concrete", "concrete:plates", "concrete:lanes",
  "paving_stones", "sett", "chipseal", "metal", "cobblestone:flattened",
]);
const UNPAVED = new Set([
  "unpaved", "gravel", "fine_gravel", "compacted", "dirt", "ground",
  "earth", "grass", "sand", "mud", "pebblestone", "rock", "woodchips",
  "cobblestone", "grass_paver", "clay",
]);

function surfaceOf(wayTags: string): string | null {
  const m = /(?:^| )surface=([^ ]+)/.exec(wayTags);
  return m ? m[1] : null;
}

/**
 * Summarize paved vs unpaved distance from BRouter's `messages` table
 * (row 0 is the header; uses the Distance and WayTags columns).
 */
export function summarizeSurface(messages: string[][]): SurfaceSummary {
  const empty: SurfaceSummary = {
    pavedMeters: 0, unpavedMeters: 0, unknownMeters: 0, pavedRatio: null,
  };
  if (!Array.isArray(messages) || messages.length < 2) return empty;

  const header = messages[0];
  const di = header.indexOf("Distance");
  const wi = header.indexOf("WayTags");
  if (di < 0) return empty;

  let paved = 0;
  let unpaved = 0;
  let unknown = 0;
  for (let i = 1; i < messages.length; i++) {
    const r = messages[i];
    const dist = Number(r[di]) || 0;
    const s = wi >= 0 ? surfaceOf(r[wi] ?? "") : null;
    if (s && PAVED.has(s)) paved += dist;
    else if (s && UNPAVED.has(s)) unpaved += dist;
    else unknown += dist;
  }
  const known = paved + unpaved;
  return {
    pavedMeters: paved,
    unpavedMeters: unpaved,
    unknownMeters: unknown,
    pavedRatio: known > 0 ? paved / known : null,
  };
}
