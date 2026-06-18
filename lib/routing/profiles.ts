import type { Profile } from "../types";

export type ProfileDef = {
  id: Profile;
  label: string;
  /** BRouter profile name (verify availability on the public server). */
  brouter: string;
  travel: "bicycling" | "walking";
  /** Typical speed, used to estimate time for manual (straight-line) routes. */
  speedKmh: number;
};

export const PROFILES: ProfileDef[] = [
  // "Bici" prioritises asphalt (BRouter fastbike strongly prefers paved roads).
  { id: "bike", label: "Bici", brouter: "fastbike", travel: "bicycling", speedKmh: 20 },
  { id: "mtb", label: "MTB", brouter: "mtb", travel: "bicycling", speedKmh: 14 },
  { id: "foot", label: "Caminar", brouter: "hiking-mountain", travel: "walking", speedKmh: 4.5 },
];

const FALLBACK: ProfileDef = PROFILES[0];

export function profileDef(id: Profile): ProfileDef {
  return PROFILES.find((p) => p.id === id) ?? FALLBACK;
}

export function brouterProfile(id: Profile): string {
  return profileDef(id).brouter;
}
