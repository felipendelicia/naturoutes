"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { trackStats, type Fix } from "@/lib/tracking/recorder";
import { distance } from "@/lib/geo/haversine";

export type RecorderStatus = "idle" | "recording" | "paused";

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const fixesRef = useRef<Fix[]>([]);

  const stats = useMemo(() => trackStats(fixes), [fixes]);

  const clearWatch = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalización no disponible");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: Fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          ele: pos.coords.altitude ?? undefined,
          t: Date.now(),
        };
        setFixes((prev) => {
          const last = prev[prev.length - 1];
          if (last && distance(last, fix) < 3) return prev; // drop jitter
          const next = [...prev, fix];
          fixesRef.current = next;
          return next;
        });
      },
      () => setError("No se pudo seguir tu ubicación"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }, []);

  const start = useCallback(() => {
    setError(null);
    setFixes([]);
    fixesRef.current = [];
    setStatus("recording");
    startWatch();
  }, [startWatch]);

  const pause = useCallback(() => {
    clearWatch();
    setStatus("paused");
  }, [clearWatch]);

  const resume = useCallback(() => {
    setStatus("recording");
    startWatch();
  }, [startWatch]);

  const stop = useCallback((): Fix[] => {
    clearWatch();
    setStatus("idle");
    return fixesRef.current;
  }, [clearWatch]);

  const reset = useCallback(() => {
    setFixes([]);
    fixesRef.current = [];
  }, []);

  return { status, fixes, stats, error, start, pause, resume, stop, reset };
}
