"use client";

import { useCallback, useState } from "react";
import type { LatLng } from "@/lib/types";

export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalización no disponible");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      () => setError("No se pudo obtener tu ubicación"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { position, error, locate };
}
