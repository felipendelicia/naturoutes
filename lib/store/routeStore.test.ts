import { describe, it, expect } from "vitest";
import {
  saveRoute,
  listRoutes,
  getRoute,
  removeRoute,
  type KV,
} from "./routeStore";
import type { Route } from "../types";

function memKv(): KV {
  const m = new Map<string, unknown>();
  return {
    get: async <T>(k: string) => m.get(k) as T | undefined,
    set: async (k, v) => {
      m.set(k, v);
    },
    del: async (k) => {
      m.delete(k);
    },
    keys: async () => [...m.keys()],
  };
}

const route: Route = {
  waypoints: [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
  ],
  geometry: [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
  ],
  distanceMeters: 1000,
  profile: "bike",
  mode: "auto",
};

describe("routeStore", () => {
  it("saves a route and lists it back", async () => {
    const kv = memKv();
    const saved = await saveRoute(kv, route, "Casa → Parque", { now: 100 });
    expect(saved.id).toBeTruthy();
    expect(saved.name).toBe("Casa → Parque");
    expect(saved.createdAt).toBe(100);
    expect(saved.updatedAt).toBe(100);

    const all = await listRoutes(kv);
    expect(all).toHaveLength(1);
    expect(all[0].distanceMeters).toBe(1000);
  });

  it("updating by id keeps createdAt and bumps updatedAt", async () => {
    const kv = memKv();
    const a = await saveRoute(kv, route, "v1", { now: 100 });
    const b = await saveRoute(kv, route, "v2", { id: a.id, now: 250 });
    expect(b.id).toBe(a.id);
    expect(b.createdAt).toBe(100);
    expect(b.updatedAt).toBe(250);
    expect((await listRoutes(kv))).toHaveLength(1);
    expect((await getRoute(kv, a.id))?.name).toBe("v2");
  });

  it("lists routes newest-updated first", async () => {
    const kv = memKv();
    await saveRoute(kv, route, "older", { now: 100 });
    await saveRoute(kv, route, "newer", { now: 200 });
    const all = await listRoutes(kv);
    expect(all.map((r) => r.name)).toEqual(["newer", "older"]);
  });

  it("removes a route", async () => {
    const kv = memKv();
    const a = await saveRoute(kv, route, "borrame", { now: 100 });
    await removeRoute(kv, a.id);
    expect(await listRoutes(kv)).toHaveLength(0);
    expect(await getRoute(kv, a.id)).toBeUndefined();
  });
});
