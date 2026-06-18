"use client";

import { useState } from "react";
import { BASE_LAYERS } from "@/lib/map/layers";

export default function LayerSwitcher({
  value,
  onChange,
  poisEnabled,
  onTogglePois,
}: {
  value: string;
  onChange: (id: string) => void;
  poisEnabled: boolean;
  onTogglePois: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Capa del mapa"
        aria-expanded={open}
        className="panel pointer-events-auto grid h-9 w-9 place-items-center rounded-2xl text-pine"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
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
          <ul className="panel pointer-events-auto absolute right-0 top-full z-[1100] mt-2 w-40 overflow-hidden rounded-2xl py-1">
            {BASE_LAYERS.map((l) => {
              const active = l.id === value;
              return (
                <li key={l.id}>
                  <button
                    onClick={() => {
                      onChange(l.id);
                      setOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-pine/8 ${
                      active ? "font-semibold text-blaze-deep" : "text-pine"
                    }`}
                  >
                    {l.label}
                  </button>
                </li>
              );
            })}
            <li className="my-1 border-t border-pine/10" />
            <li>
              <button
                onClick={() => {
                  onTogglePois();
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-pine transition hover:bg-pine/8"
              >
                <span>Puntos de interés</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    poisEnabled ? "bg-blaze" : "bg-pine/20"
                  }`}
                />
              </button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
