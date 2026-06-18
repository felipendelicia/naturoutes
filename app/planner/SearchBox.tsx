"use client";

import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "@/lib/geo/geocoding";

export default function SearchBox({
  onSelect,
}: {
  onSelect: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

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
          setOpen(true);
        })
        .catch(() => {
          if (id === reqId.current) setError("No se pudo buscar");
        });
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  function choose(place: Place) {
    onSelect(place);
    setQuery(place.label.split(",")[0]);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="pointer-events-auto relative">
      <div className="panel flex items-center gap-2 rounded-2xl px-3 py-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.5" stroke="var(--pine-soft)" strokeWidth="1.8" />
          <path d="M16 16l4.5 4.5" stroke="var(--pine-soft)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar lugar…"
          aria-label="Buscar lugar"
          className="w-full bg-transparent text-sm text-pine placeholder:text-moss/70 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setError(null);
            }}
            aria-label="Borrar búsqueda"
            className="text-moss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && (results.length > 0 || error) && (
        <ul className="panel absolute inset-x-0 top-full z-[1001] mt-2 max-h-64 overflow-auto rounded-2xl py-1">
          {error && results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-moss">{error}</li>
          ) : (
            results.map((p, i) => (
              <li key={i}>
                <button
                  onClick={() => choose(p)}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-pine transition hover:bg-pine/8"
                >
                  {p.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
