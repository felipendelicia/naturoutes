"use client";

import { useCallback, useState } from "react";
import { layerById, type BaseLayer } from "@/lib/map/layers";

const KEY = "naturoutes:layer";

function load(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function save(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* storage unavailable */
  }
}

export function useLayer() {
  const [id, setIdState] = useState<string>(() => load() ?? "osm");
  const setId = useCallback((newId: string) => {
    setIdState(newId);
    save(newId);
  }, []);
  const layer: BaseLayer = layerById(id);
  return { id, layer, setId };
}
