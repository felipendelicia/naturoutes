"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/types";
import { saveLastLocation } from "./lastLocation";

export type GeoFix = LatLng & { accuracy: number };

export function useGeolocation() {
  const [position, setPosition] = useState<GeoFix | null>(null);
  const [centerTarget, setCenterTarget] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalización no disponible");
      return;
    }
    setError(null);
    stop();
    let centered = false;
    const start = Date.now();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: GeoFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        // Keep the most accurate fix seen this session for the marker.
        setPosition((prev) =>
          !prev || fix.accuracy <= prev.accuracy ? fix : prev,
        );
        // Remember it so the next visit starts here instead of Madrid.
        saveLastLocation({ lat: fix.lat, lng: fix.lng });
        // Recenter the map only once per locate request.
        if (!centered) {
          centered = true;
          setCenterTarget({ lat: fix.lat, lng: fix.lng });
        }
        // Stop once accurate enough or after 15s of refining.
        if (fix.accuracy <= 30 || Date.now() - start > 15000) stop();
      },
      () => {
        setError("No se pudo obtener tu ubicación");
        stop();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { position, centerTarget, error, locate };
}
