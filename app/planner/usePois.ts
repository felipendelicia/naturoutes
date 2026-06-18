"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPois, type Poi, type PoiKind } from "@/lib/poi/overpass";
import type { BBox } from "@/lib/types";

const KINDS: PoiKind[] = ["water", "shelter", "bicycle_parking", "bicycle_shop"];
const MAX_SPAN_DEG = 0.25; // ~28 km; above this, skip Overpass (too broad)

function tooLarge(b: BBox): boolean {
  return b.north - b.south > MAX_SPAN_DEG || b.east - b.west > MAX_SPAN_DEG;
}

export function usePois(bbox: BBox | null) {
  const [enabled, setEnabled] = useState(false);
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled || !bbox || tooLarge(bbox)) return;
    const id = ++reqId.current;
    const t = setTimeout(() => {
      setLoading(true);
      fetchPois(bbox, KINDS)
        .then((p) => {
          if (id === reqId.current) setPois(p);
        })
        .catch(() => {
          /* Overpass down / rate-limited — leave the layer empty */
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 600);
    return () => clearTimeout(t);
  }, [enabled, bbox]);

  const toggle = useCallback(() => setEnabled((e) => !e), []);

  return { enabled, pois: enabled ? pois : [], loading, toggle };
}
