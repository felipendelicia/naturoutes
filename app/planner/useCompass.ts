"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type OrientationEventiOS = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};
type DOEStatic = {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handler = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  const stop = useCallback(() => {
    if (handler.current) {
      window.removeEventListener("deviceorientation", handler.current, true);
      handler.current = null;
    }
    setActive(false);
    setHeading(null);
  }, []);

  const start = useCallback(async () => {
    const DOE = (
      typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined
    ) as (typeof DeviceOrientationEvent & DOEStatic) | undefined;
    if (!DOE) {
      setError("Brújula no disponible");
      return;
    }
    try {
      if (typeof DOE.requestPermission === "function") {
        const res = await DOE.requestPermission();
        if (res !== "granted") {
          setError("Permiso de orientación denegado");
          return;
        }
      }
      const onOrient = (e: DeviceOrientationEvent) => {
        const ev = e as OrientationEventiOS;
        let h: number | null = null;
        if (typeof ev.webkitCompassHeading === "number") {
          h = ev.webkitCompassHeading;
        } else if (e.alpha != null) {
          h = 360 - e.alpha;
        }
        if (h != null) setHeading(((h % 360) + 360) % 360);
      };
      handler.current = onOrient;
      window.addEventListener("deviceorientation", onOrient, true);
      setActive(true);
      setError(null);
    } catch {
      setError("No se pudo activar la brújula");
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { heading, active, error, start, stop };
}
