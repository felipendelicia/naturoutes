"use client";

import { useCallback, useEffect, useState } from "react";
import { idbKv } from "@/lib/store/idbKv";
import {
  listRoutes,
  removeRoute,
  saveRoute,
  type SavedRoute,
} from "@/lib/store/routeStore";
import type { Route } from "@/lib/types";

export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);

  const reload = useCallback(() => {
    listRoutes(idbKv)
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (route: Route, name: string, kind?: "planned" | "recorded") => {
      await saveRoute(idbKv, route, name, { kind });
      reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await removeRoute(idbKv, id);
      reload();
    },
    [reload],
  );

  return { routes, save, remove, reload };
}
