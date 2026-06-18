# E2 · Capas de mapa + POIs (spec)

Fecha: 2026-06-17 · Estado: aprobado (roadmap) · App: naturoutes (front-only, sin backend)

## Propósito
Más contexto en el mapa: poder cambiar la capa base (calle / satélite / relieve / ciclovías)
y mostrar puntos de interés útiles para salidas (agua, refugios, bici-friendly).

## En alcance
- **Conmutador de capas base** (una activa a la vez):
  - Calle: OSM estándar (actual).
  - Satélite: Esri World Imagery (`.../World_Imagery/MapServer/tile/{z}/{y}/{x}`) — ojo orden `{y}/{x}`.
  - Relieve: OpenTopoMap (`https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`).
  - Ciclovías: CyclOSM (`https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png`).
  Cada una con su atribución. La selección se persiste en localStorage.
- **POIs vía Overpass API** (público, sin key): capa toggleable que consulta amenities en el
  bounding box visible: `drinking_water`, `shelter`, `bicycle_parking`, `bicycle` (tienda/repair).
  Resultados como marcadores con popup (nombre/tipo). Debounce al mover el mapa + límite de bbox.

## Fuera de alcance
Edición de POIs, capas custom del usuario, búsqueda de POIs por nombre (eso es geocoding, ya existe).

## Arquitectura
- `lib/map/layers.ts` (nuevo, puro): catálogo de capas base `{ id, label, url, attribution, maxZoom, subdomains? }`. Fuente única.
- `lib/poi/overpass.ts` (nuevo, puro+fetch): `buildOverpassQuery(bbox, kinds) => string` (puro, testeable)
  y `fetchPois(bbox, kinds, fetchImpl?) => Promise<Poi[]>`. `Poi = { id, lat, lng, kind, name? }`.
- `app/planner/useLayer.ts` (nuevo): capa base activa + persistencia (localStorage).
- `app/planner/usePois.ts` (nuevo): dispara `fetchPois` al cambiar el bbox (debounce), guarda resultados, maneja toggle on/off.
- `app/planner/LayerSwitcher.tsx` (nuevo): UI compacta para elegir capa base + toggle de POIs.
- `app/planner/MapView.tsx`: `TileLayer` usa la capa activa; render de markers de POI con popup;
  emite el bbox visible (`moveend`) hacia arriba para `usePois`.

## Flujo de datos
1. `useLayer` decide la `TileLayer` activa (persistida).
2. Si POIs ON, al terminar de mover el mapa (`moveend`) se toma el bbox y `usePois` consulta Overpass (debounced); render de markers.

## Manejo de errores
Tiles que no cargan → Leaflet muestra gris; mantener atribución. Overpass caído/rate-limited
→ toast y dejar la capa vacía (no romper). Bbox demasiado grande (mucho zoom out) → no consultar (pedir acercar).

## Testing (Vitest)
- `layers`: catálogo completo y URLs/atribuciones presentes.
- `overpass.buildOverpassQuery`: arma QL correcto por bbox+kinds; parser de respuesta Overpass → `Poi[]` con fixture.
Render de tiles/markers: verificación en navegador.

## Fases
1. Catálogo de capas + `useLayer` + `LayerSwitcher` + `TileLayer` dinámica (persistida).
2. Overpass (query + fetch + parser) con TDD.
3. `usePois` + emisión de bbox desde MapView + render de markers/popup + toggle.
