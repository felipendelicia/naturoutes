import type { Profile } from "../types";

export type ProfileDef = {
  id: Profile;
  label: string;
  /** BRouter profile name (verify availability on the public server). */
  brouter: string;
  travel: "bicycling" | "walking";
};

export const PROFILES: ProfileDef[] = [
  { id: "bike", label: "Bici", brouter: "trekking", travel: "bicycling" },
  { id: "bike-fast", label: "Bici rápida", brouter: "fastbike", travel: "bicycling" },
  { id: "mtb", label: "MTB", brouter: "mtb", travel: "bicycling" },
  { id: "gravel", label: "Gravel", brouter: "gravel", travel: "bicycling" },
  { id: "foot", label: "Caminar", brouter: "hiking-mountain", travel: "walking" },
];

const FALLBACK: ProfileDef = PROFILES[0];

export function profileDef(id: Profile): ProfileDef {
  return PROFILES.find((p) => p.id === id) ?? FALLBACK;
}

export function brouterProfile(id: Profile): string {
  return profileDef(id).brouter;
}
