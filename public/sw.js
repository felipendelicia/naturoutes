// naturoutes service worker — app shell + tile caching for offline use.
const VERSION = "v1";
const SHELL_CACHE = `naturoutes-shell-${VERSION}`;
const TILE_CACHE = `naturoutes-tiles-${VERSION}`;
const BASE = new URL(self.registration.scope).pathname; // "/" or "/naturoutes/"

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        await cache.add(new Request(BASE, { cache: "reload" }));
      } catch {
        /* offline at install — shell will be cached on first online load */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // OSM tiles → stale-while-revalidate.
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(staleWhileRevalidate(req, TILE_CACHE));
    return;
  }

  // Page navigations → network-first, fall back to cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          return (await caches.match(BASE)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Same-origin assets (hashed _next bundles) → cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
  }
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
