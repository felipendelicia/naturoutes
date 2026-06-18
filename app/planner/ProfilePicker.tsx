"use client";

import { useState } from "react";
import { PROFILES } from "@/lib/routing/profiles";
import type { Profile } from "@/lib/types";

const EMOJI: Record<Profile, string> = {
  bike: "🚲",
  "bike-fast": "⚡",
  mtb: "⛰️",
  gravel: "🌾",
  foot: "🥾",
};

export default function ProfilePicker({
  value,
  onChange,
}: {
  value: Profile;
  onChange: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = PROFILES.find((p) => p.id === value) ?? PROFILES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Actividad"
        aria-expanded={open}
        className="panel pointer-events-auto flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[13px] font-semibold text-pine"
      >
        <span aria-hidden>{EMOJI[current.id]}</span>
        <span>{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="text-moss">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[1090] cursor-default"
          />
          <ul className="panel pointer-events-auto absolute right-0 top-full z-[1100] mt-2 w-44 overflow-hidden rounded-2xl py-1">
            {PROFILES.map((p) => {
              const active = p.id === value;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-pine/8 ${
                      active ? "font-semibold text-blaze-deep" : "text-pine"
                    }`}
                  >
                    <span aria-hidden>{EMOJI[p.id]}</span>
                    <span>{p.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
