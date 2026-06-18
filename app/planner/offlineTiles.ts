import { tilesForBBox, tileUrl } from "@/lib/map/tiles";
import type { BaseLayer } from "@/lib/map/layers";
import type { BBox } from "@/lib/types";

export const OFFLINE_CACHE = "naturoutes-tiles-offline";
export const MAX_TILES = 5000;
const CONCURRENCY = 6;

export async function downloadArea(
  layer: BaseLayer,
  bbox: BBox,
  minZoom: number,
  maxZoom: number,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ done: number; failed: number; total: number }> {
  const tiles = tilesForBBox(bbox, minZoom, maxZoom);
  const cache = await caches.open(OFFLINE_CACHE);
  const subs = layer.subdomains ?? "a";
  const queue = tiles.slice();
  let done = 0;
  let failed = 0;

  const worker = async () => {
    while (queue.length) {
      if (signal?.aborted) return;
      const t = queue.shift();
      if (!t) return;
      const sub = subs[(t.x + t.y) % subs.length];
      const url = tileUrl(layer.url, t, sub);
      try {
        const res = await fetch(url, { signal, mode: "cors" });
        if (res.ok) await cache.put(url, res.clone());
        else failed++;
      } catch {
        failed++;
      }
      done++;
      onProgress(done, tiles.length);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { done, failed, total: tiles.length };
}

export async function clearOffline(): Promise<void> {
  if (typeof caches === "undefined") return;
  await caches.delete(OFFLINE_CACHE);
}

export async function offlineTileCount(): Promise<number> {
  if (typeof caches === "undefined") return 0;
  const cache = await caches.open(OFFLINE_CACHE);
  return (await cache.keys()).length;
}
