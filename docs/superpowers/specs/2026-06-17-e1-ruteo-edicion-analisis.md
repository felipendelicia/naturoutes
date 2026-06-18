# E1 · Núcleo de ruteo + edición/análisis (spec)

Fecha: 2026-06-17 · Estado: aprobado (roadmap) · App: naturoutes (front-only, sin backend)

## Propósito
Subir el core del planner: elegir perfil de actividad, ver rutas alternativas, conocer
tiempo estimado y tipo de camino, invertir la ruta, un perfil de elevación interactivo y
poder editar los waypoints (arrastrar, insertar, borrar uno).

## En alcance
- **Selector de perfil** mapeado a perfiles BRouter (verificar disponibilidad en el server público al implementar):
  `bici → trekking`, `bici-rápida → fastbike`, `MTB → mtb`, `gravel → gravel`, `pie → hiking-mountain`.
  Si un perfil no existe en el server, cae a `trekking`/`hiking-mountain` y se avisa.
- **Rutas alternativas**: pedir `alternativeidx` 0..3 a BRouter; mostrar hasta 3, el usuario elige; la elegida pasa a ser la ruta activa.
- **Tiempo estimado**: de `total-time` de BRouter (fallback: distancia / velocidad por perfil).
- **Superficie / tipo de camino**: parsear los `messages` del GeoJSON de BRouter (columnas con tags `surface`, `highway`); resumir % asfalto vs no-asfalto.
- **Invertir ruta**: reordenar waypoints y recalcular.
- **Perfil de elevación interactivo**: hover/touch sobre el gráfico → marcador en el punto correspondiente del mapa.
- **Edición de waypoints**: arrastrar un waypoint (recalcula), insertar un punto en un tramo (click sobre la polyline), borrar un waypoint puntual.

## Fuera de alcance
Generador de loops/round-trip (BRouter no lo soporta; resultados client-side malos → YAGNI).

## Arquitectura (sobre lo existente)
Lógica pura en `lib/`, UI client en `app/planner/`. El estado del planner ya vive en
`lib/planner/reducer.ts` + `usePlanner`. Extensiones:

- `lib/types.ts`: `Profile` pasa de `"bike"|"foot"` a un set extendido; `Route` suma
  `timeSeconds?`, `surface?: { pavedRatio: number }`, y `alternatives?` se maneja fuera de `Route`.
- `lib/routing/brouter.ts`: `fetchBrouterRoute` acepta `alternativeidx`; parser extrae
  `total-time` y los `messages` (tags). Nueva fn `fetchAlternatives(waypoints, profile) => Route[]`.
- `lib/routing/surface.ts` (nuevo, puro): `summarizeSurface(messages) => { pavedRatio }`.
- `lib/planner/reducer.ts`: acciones nuevas `move` (índice→latlng), `insert` (índice, latlng), `removeAt` (índice), `reverse`.
- `app/planner/MapView.tsx`: marcadores de waypoint **draggable**, click en polyline para insertar, marcador de hover de elevación.
- `app/planner/ElevationProfile.tsx`: emitir `onHover(point|null)`.
- `app/planner/ProfilePicker.tsx` (nuevo) y `AlternativesBar.tsx` (nuevo).

### Perfiles (lib/routing/profiles.ts, nuevo)
`export const PROFILES: { id: Profile; label: string; brouter: string }[]` — fuente única
para el picker y el cliente BRouter (reemplaza `BROUTER_PROFILE`).

## Flujo de datos
1. Usuario marca puntos → `usePlanner` pide a `routing.computeRoute` (auto) la ruta + (si auto) `fetchAlternatives`.
2. Alternativas se muestran en `AlternativesBar`; elegir una setea la ruta activa.
3. La ruta activa alimenta mapa, elevación (con hover), distancia/tiempo/superficie.
4. Editar waypoints despacha `move/insert/removeAt/reverse` → recalcula (debounced).

## Manejo de errores
Perfil inexistente → fallback + toast. Alternativas que fallan → mostrar solo la principal.
`messages` ausentes → ocultar superficie. Drag/insert sin red (auto) → degradar a manual.

## Testing (Vitest, módulos puros)
- `profiles`: mapeo id→brouter completo y estable.
- `brouter`: parsea `total-time`; `fetchAlternatives` arma N requests con `alternativeidx` correcto.
- `surface.summarizeSurface`: ratios con fixtures de `messages`.
- `reducer`: `move/insert/removeAt/reverse` (transiciones).
- Elevación: ya cubierto; sumar test de mapeo distancia→índice para el hover.

## Fases
1. Perfiles (módulo + picker + cableado).
2. Alternativas (cliente + barra + selección).
3. Tiempo + superficie (parser + UI en el panel).
4. Invertir + edición de waypoints (reducer + mapa draggable/insert/delete).
5. Perfil de elevación interactivo (hover ↔ mapa).
