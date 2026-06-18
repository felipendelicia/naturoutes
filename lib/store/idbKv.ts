import { createStore, get, set, del, keys } from "idb-keyval";
import type { KV } from "./routeStore";

const store = createStore("naturoutes", "routes");

export const idbKv: KV = {
  get: <T>(k: string) => get<T>(k, store),
  set: (k, v) => set(k, v, store),
  del: (k) => del(k, store),
  keys: async () => (await keys(store)).map(String),
};
