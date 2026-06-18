import type { Route } from "../types";

export type SavedRoute = Route & {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  kind?: "planned" | "recorded";
};

export interface KV {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, val: unknown): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

const PREFIX = "route:";

export async function saveRoute(
  kv: KV,
  route: Route,
  name: string,
  opts: { id?: string; now?: number; kind?: "planned" | "recorded" } = {},
): Promise<SavedRoute> {
  const now = opts.now ?? Date.now();
  const id = opts.id ?? crypto.randomUUID();
  const existing = opts.id
    ? await kv.get<SavedRoute>(PREFIX + id)
    : undefined;
  const saved: SavedRoute = {
    ...route,
    id,
    name,
    kind: opts.kind ?? existing?.kind ?? "planned",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await kv.set(PREFIX + id, saved);
  return saved;
}

export async function listRoutes(kv: KV): Promise<SavedRoute[]> {
  const keys = (await kv.keys()).filter((k) => k.startsWith(PREFIX));
  const routes = await Promise.all(
    keys.map((k) => kv.get<SavedRoute>(k)),
  );
  return routes
    .filter((r): r is SavedRoute => Boolean(r))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getRoute(
  kv: KV,
  id: string,
): Promise<SavedRoute | undefined> {
  return kv.get<SavedRoute>(PREFIX + id);
}

export async function removeRoute(kv: KV, id: string): Promise<void> {
  await kv.del(PREFIX + id);
}
