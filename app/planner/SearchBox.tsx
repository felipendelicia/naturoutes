"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchPlaces, type Place } from "@/lib/geo/geocoding";
import { distance } from "@/lib/geo/haversine";
import type { LatLng } from "@/lib/types";

function fmtKm(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  if (m < 10000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 1000)} km`;
}

export default function SearchBox({
  origin,
  onSelect,
  onActivate,
}: {
  origin: LatLng | null;
  onSelect: (place: Place) => void;
  onActivate?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    const q = query.trim();
    const id = ++reqId.current;
    const t = setTimeout(() => {
      if (q.length < 3) {
        if (id === reqId.current) {
          setResults([]);
          setError(null);
        }
        return;
      }
      searchPlaces(q)
        .then((places) => {
          if (id !== reqId.current) return;
          setResults(places);
          setError(places.length === 0 ? "Sin resultados" : null);
        })
        .catch(() => {
          if (id === reqId.current) setError("No se pudo buscar");
        });
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  // Order results by distance to the user (closest first).
  const sorted = useMemo(() => {
    if (!origin) return results;
    return [...results]
      .map((p) => ({ p, d: distance(origin, p) }))
      .sort((a, b) => a.d - b.d)
      .map(({ p, d }) => ({ ...p, _d: d }) as Place & { _d: number });
  }, [results, origin]);

  function open() {
    setExpanded(true);
    onActivate?.();
  }

  function collapse() {
    setExpanded(false);
    setQuery("");
    setResults([]);
    setError(null);
  }

  function choose(place: Place) {
    onSelect(place);
    collapse();
  }

  if (!expanded) {
    return (
      <button
        onClick={open}
        aria-label="Buscar lugar"
        className="panel pointer-events-auto grid h-9 w-9 place-items-center rounded-full text-pine-soft transition active:scale-95"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto relative w-56">
      <div className="panel flex items-center gap-1.5 rounded-full px-2.5 py-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-pine-soft">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar lugar…"
          aria-label="Buscar lugar"
          className="w-full bg-transparent text-xs text-pine placeholder:text-moss/70 focus:outline-none"
        />
        <button onClick={collapse} aria-label="Cerrar búsqueda" className="shrink-0 text-moss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {(sorted.length > 0 || error) && (
        <ul className="panel absolute inset-x-0 top-full z-[1001] mt-2 max-h-60 overflow-auto rounded-2xl py-1">
          {error && sorted.length === 0 ? (
            <li className="px-3 py-2 text-xs text-moss">{error}</li>
          ) : (
            sorted.map((p, i) => {
              const d = (p as Place & { _d?: number })._d;
              return (
                <li key={i}>
                  <button
                    onClick={() => choose(p)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-pine/8"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs text-pine">
                      {p.label}
                    </span>
                    {d != null && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-blaze/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blaze-deep">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M3 11l18-8-8 18-2-8-8-2z" />
                        </svg>
                        {fmtKm(d)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
