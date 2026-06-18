"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocode } from "@/lib/geo/geocoding";
import { coordKey, resolveStopLabel } from "@/lib/geo/stopLabel";
import type { LatLng } from "@/lib/types";

/**
 * Returns a label resolver for waypoints: "Mi ubicación" for the GPS origin,
 * a reverse-geocoded name (lazy, cached, throttled to ~1 req/s) otherwise.
 */
export function useStopLabels(waypoints: LatLng[], originKey: string | null) {
  const cache = useRef<Record<string, string>>({});
  const inFlight = useRef<Set<string>>(new Set());
  const [, bump] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const p of waypoints) {
        const key = coordKey(p);
        if (key === originKey || cache.current[key] || inFlight.current.has(key)) {
          continue;
        }
        inFlight.current.add(key);
        try {
          const label = await reverseGeocode(p);
          if (label) {
            cache.current[key] = label;
            if (!cancelled) bump((n) => n + 1);
          }
        } catch {
          /* leave it unlabeled */
        } finally {
          inFlight.current.delete(key);
        }
        await new Promise((r) => setTimeout(r, 1100)); // Nominatim: 1 req/s
        if (cancelled) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [waypoints, originKey]);

  const seed = useCallback((p: LatLng, label: string) => {
    cache.current[coordKey(p)] = label;
    bump((n) => n + 1);
  }, []);

  const labelFor = (p: LatLng): string | null =>
    resolveStopLabel(coordKey(p), originKey, cache.current);

  return { labelFor, seed };
}

