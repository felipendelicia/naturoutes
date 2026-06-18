# naturoutes — Planificador de rutas (spec)

Fecha: 2026-06-17
Estado: aprobado (brainstorming)

## Propósito

Web app **100% front, estática y sin backend** para planificar rutas de **bici o caminata**
sobre un mapa. Mobile-first, instalable como PWA. Deploy en GitHub Pages bajo `/naturoutes`.

El usuario marca puntos en el mapa, obtiene una ruta (ajustada a caminos o líneas rectas),
ve distancia y perfil de elevación, la guarda en su dispositivo y la exporta (GPX/KML/Google Maps).

## Principios / restricciones

- **Sin backend propio.** Toda lógica corre en el navegador. APIs externas se llaman directo desde el cliente.
- **Toda llamada externa puede fallar** (offline/rate limit) → degradar con gracia, nunca romper la app.
- **Lógica pura separada del DOM/mapa** para poder testearla sin navegador.
- **Mobile-first.** Targets táctiles grandes, bottom sheets, gestos.
- YAGNI: sin cuentas, sin sharing por servidor, sin navegación turn-by-turn, sin terreno 3D.

## Arquitectura

Next.js (App Router) con `output: 'export'`. Una página principal `/` que monta el planner.
Todo el árbol del planner es **client-only** (`next/dynamic`, `{ ssr: false }`) porque Leaflet toca `window`.

Separación en capas:

- **UI (componentes React)** — presentación, mobile-first. Se construyen con el skill `frontend-design`.
- **Estado del planner** — un store/contexto que mantiene waypoints, modo, perfil, ruta calculada, distancia, elevación.
- **Servicios (módulos puros, sin React)** — routing, geocoding, persistencia, import/export. Testeables aislados.

### Unidades (qué hace / interfaz / dependencias)

| Unidad | Qué hace | Interfaz (aprox.) | Depende de |
|--------|----------|-------------------|------------|
| `MapView` | Render del mapa, tiles OSM, polyline de ruta, markers, posición actual | props: `route`, `waypoints`, `onMapClick`, `userPosition` | Leaflet, react-leaflet |
| `usePlanner` | Estado central del planner | `{ waypoints, mode, profile, route, addWaypoint, undo, clear, setMode, setProfile }` | servicios de routing |
| `routing` | Calcula ruta desde waypoints | `route(waypoints, {mode, profile}) => Promise<Route>` | `brouter`, `manual`, haversine |
| `brouter` | Cliente de la API BRouter | `fetchRoute(waypoints, profile) => Promise<Route>` | fetch, BRouter |
| `manualRoute` | Une waypoints con líneas rectas | `build(waypoints) => Route` | haversine |
| `geocoding` | Búsqueda de lugares | `search(query) => Promise<Place[]>` | fetch, Nominatim |
| `geolocation` | Posición actual del usuario | `useGeolocation() => {position, error, locate}` | `navigator.geolocation` |
| `routeStore` | Persistencia local | `save / get / list / remove` | IndexedDB (idb-keyval) |
| `gpx` | Serializar/parsear GPX | `toGpx(route) / fromGpx(text) => Route` | — |
| `kml` | Serializar KML (Google My Maps) | `toKml(route) => string` | — |
| `googleMaps` | Link de direcciones | `directionsUrl(route, profile) => string` | — |
| `ElevationProfile` | Gráfico de altimetría | props: `route` | lib de chart liviana |
| `SearchBox` | UI de búsqueda | usa `geocoding` | — |
| `RouteList` | Listar/abrir/borrar rutas guardadas | usa `routeStore` | — |

### Modelo de datos

```ts
type LatLng = { lat: number; lng: number };
type RoutePoint = LatLng & { ele?: number }; // ele en metros

type Route = {
  id: string;
  name: string;
  profile: 'bike' | 'foot';
  mode: 'auto' | 'manual';
  waypoints: LatLng[];        // puntos que marcó el usuario
  geometry: RoutePoint[];     // polyline final (densificada por el router)
  distanceMeters: number;
  ascentMeters?: number;
  createdAt: number;
  updatedAt: number;
};
```

### APIs externas

- **Tiles**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Atribución OSM obligatoria. Uso personal, sin bulk.
- **Routing — BRouter** (`https://brouter.de/brouter`):
  `?lonlats=lng,lat|lng,lat&profile=<p>&alternativeidx=0&format=geojson`.
  Mapeo de perfil: `bike → trekking`, `foot → hiking-mountain`. Devuelve GeoJSON con geometría
  (lng,lat,ele) y propiedades (`track-length`, `filtered ascend`/`total-energy`). Fallback: si BRouter
  falla o está offline → caer a `manualRoute` y avisar al usuario.
- **Geocoding — Nominatim** (`https://nominatim.openstreetmap.org/search?format=json&q=...`):
  política de uso: máx **1 req/s**, identificar la app (`?email=` o Referer del sitio). Throttle + debounce
  en el SearchBox. Cachear resultados por query en memoria.

### Flujo de datos

1. Usuario toca el mapa → `usePlanner.addWaypoint(latlng)`.
2. `usePlanner` llama `routing.route(waypoints, {mode, profile})` (debounced).
3. `routing` despacha a `brouter` (auto) o `manualRoute` (manual) → `Route`.
4. `Route` actualiza `MapView` (polyline) y `ElevationProfile` (altimetría) y el panel de distancia.
5. Guardar → `routeStore.save(route)`; listar → `RouteList`; exportar → `gpx`/`kml`/`googleMaps`.

### Manejo de errores

- Routing falla → toast "no se pudo calcular la ruta automática, usando línea recta" + modo manual.
- Geolocalización denegada/sin fix → mensaje no bloqueante; el mapa sigue usable.
- Geocoding falla/rate-limited → mensaje en el SearchBox; no romper.
- Offline (PWA) → app shell desde cache; routing/geocoding muestran estado "sin conexión".
- GPX import inválido → validar y mostrar error claro; no cargar basura.

## Testing

- **Vitest** para módulos puros: `haversine`, `manualRoute`, parseo/serialización `gpx`, `kml`,
  `googleMaps.directionsUrl`, y el mapeo `brouter`-response → `Route` (con fixtures, sin red).
- Leaflet/IndexedDB no se testean en jsdom: la lógica vive en módulos puros; los componentes quedan finos.
- Lint + `tsc --noEmit` en CI antes del deploy.

## Plan por fases (incremental, cada fase deja algo usable)

1. **Fundaciones**: tooling (Vitest), layout mobile-first, `MapView` con tiles OSM, geolocalización (centrar).
2. **Ruteo manual**: tocar para agregar waypoints, polyline, distancia (haversine), undo/clear.
3. **Ruteo auto (BRouter)**: perfiles bici/pie, toggle auto/manual, fallback a manual.
4. **Perfil de elevación**: gráfico de altimetría + ascenso total.
5. **Búsqueda de lugares**: SearchBox con Nominatim (debounce + throttle).
6. **Persistencia**: IndexedDB, guardar/listar/abrir/borrar rutas (bottom sheet).
7. **Export/Import**: GPX export+import, KML export, "Abrir en Google Maps".
8. **PWA**: manifest + service worker, offline shell + cache de tiles, instalable.

## Fuera de alcance (por ahora)

Cuentas/login, sincronización por servidor, compartir por link propio, navegación turn-by-turn,
rutas alternativas múltiples, edición por arrastre de puntos intermedios, terreno 3D.
