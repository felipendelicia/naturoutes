# E3 · Offline (descarga de mapas por zona) (spec)

Fecha: 2026-06-17 · Estado: aprobado (roadmap) · App: naturoutes (front-only, sin backend)

## Propósito
Poder usar el mapa **sin señal** en el campo: descargar los tiles de una zona elegida (a un
rango de zoom) y que queden cacheados para cuando no haya datos.

## En alcance
- **Descargar zona**: el usuario elige el área (= bbox visible actual) y un rango de zoom
  (p.ej. actual..actual+3); se calculan los tiles y se descargan al **Cache API** (cache dedicado
  `naturoutes-tiles-offline`). Barra de progreso, cancelar, y **estimación de cantidad/peso** antes de empezar.
- **Límite de seguridad**: si la cantidad de tiles supera un máximo (p.ej. 5000), se bloquea y se pide
  achicar área o reducir zoom (evita llenar el disco / abusar del tile server).
- **Gestión**: listar zonas/uso aproximado, **borrar** lo descargado, indicador de almacenamiento.
- **Indicador offline**: detectar `navigator.onLine`/eventos y mostrar estado; el service worker ya
  sirve tiles cacheados (stale-while-revalidate); los offline se sirven desde el cache dedicado.

## Fuera de alcance
Mapas vectoriales/MBTiles, descarga de capas no-OSM, sync entre dispositivos.

## Arquitectura
- `lib/map/tiles.ts` (nuevo, puro): `tilesForBBox(bbox, minZoom, maxZoom) => {z,x,y}[]` y
  `tileUrl(template, {z,x,y}, subdomain?) => string` y `lngLatToTile(lng,lat,z)`. Matemática de tiles, testeable.
- `lib/map/tiles.ts`: `estimateTiles(bbox, minZoom, maxZoom) => number` (para el preview/límite).
- `app/planner/offlineTiles.ts` (nuevo): descarga con concurrencia limitada hacia
  `caches.open("naturoutes-tiles-offline")`, progreso y cancelación (AbortController); funciones
  `downloadArea`, `clearOffline`, `estimateUsage`.
- `app/planner/OfflinePanel.tsx` (nuevo): UI de selección de zoom, preview (#tiles), progreso, borrar.
- `public/sw.js`: en `fetch` de tiles, **primero** mirar `naturoutes-tiles-offline`; si está, servirlo
  (cache-first real); si no, el flujo SWR actual.
- `useOnline.ts` (nuevo): estado online/offline.

## Flujo de datos
1. Usuario abre `OfflinePanel`, elige zoom extra; se calcula `estimateTiles` y se muestra #tiles/peso aprox.
2. Descargar → `downloadArea` itera `tilesForBBox` con concurrencia limitada, hace `fetch` y `cache.put`; progreso.
3. Offline → el SW resuelve tiles desde `naturoutes-tiles-offline` antes de la red.

## Manejo de errores
Tiles que fallan en la descarga → se cuentan como fallidos, se sigue; reporte al final.
Exceso de tiles → bloqueo con mensaje. Sin espacio (QuotaExceeded) → abortar y avisar.
`caches` no disponible → deshabilitar la feature con nota.

## Testing (Vitest)
- `tiles.lngLatToTile` / `tilesForBBox` / `estimateTiles`: con casos conocidos (incluido cruce de meridiano y límites de z).
- `tileUrl`: sustitución de `{z}/{x}/{y}` y subdominios.
Descarga real / SW: verificación en navegador (incluye prueba offline forzando `Network: offline`).

## Fases
1. Matemática de tiles (`lib/map/tiles.ts`) con TDD.
2. `downloadArea`/`clearOffline`/`estimateUsage` + `OfflinePanel` (preview, progreso, límite).
3. SW: servir desde `naturoutes-tiles-offline` primero; `useOnline` + indicador.
