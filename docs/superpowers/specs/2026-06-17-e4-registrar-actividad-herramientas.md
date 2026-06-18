# E4 · Registrar actividad + herramientas (spec)

Fecha: 2026-06-17 · Estado: aprobado (roadmap) · App: naturoutes (front-only, sin backend)

## Propósito
Poder **grabar el recorrido real** con el GPS mientras se anda, guardarlo como ruta hecha
con stats básicos, y sumar herramientas de campo: brújula, medir distancia, y arreglar los
círculos de radio + precisión.

## En alcance
- **Grabar recorrido (tracking)**: iniciar/pausar/terminar; acumula puntos vía `watchPosition`
  (filtrando saltos por precisión), muestra tiempo, distancia y velocidad en vivo; al terminar
  guarda como ruta (`kind: "recorded"`) en IndexedDB.
- **Stats de la grabación**: distancia, duración (en movimiento vs total), velocidad media/máx, ascenso (si hay `altitude`).
- **Brújula**: rumbo desde `DeviceOrientation` (con permiso en iOS); indicador en pantalla.
- **Medir distancia**: modo efímero, tocar puntos → distancia acumulada, sin afectar la ruta.
- **Fix de círculos de radio**: centrar siempre en la posición usada, asegurar visibilidad
  (auto-encadrar/zoom para que el círculo entre), y distinguir del círculo de precisión.

## Fuera de alcance
Subir/compartir la grabación a un servidor (sin backend). Export del track se cubre con el GPX existente.

## Arquitectura
- `lib/tracking/recorder.ts` (nuevo, puro): reduce una lista de fixes `{lat,lng,ele?,t}` a stats
  `{ distanceMeters, durationMs, movingMs, avgSpeed, maxSpeed, ascentMeters }`. Pura, testeable.
- `lib/store/routeStore.ts`: `SavedRoute` suma `kind?: "planned" | "recorded"` y campos de stats opcionales.
- `app/planner/useRecorder.ts` (nuevo): maneja `watchPosition`, estado start/pause/stop, acumula fixes,
  expone stats en vivo (usando `recorder`), guarda al terminar (reusa `routeStore`/`idbKv`).
- `app/planner/RecorderControl.tsx` (nuevo): botón grande grabar + panel de stats en vivo.
- `app/planner/useCompass.ts` (nuevo): `DeviceOrientation`, normaliza el heading, pide permiso.
- `app/planner/MeasureTool.tsx` (nuevo): modo medir efímero.
- `lib/geo/measure.ts` (reusa `haversine.totalDistance`).
- Fix radios: ajustar `RadiusControl`/`MapView` para encuadrar el círculo agregado (`map.fitBounds` del círculo).

## Flujo de datos
1. Grabar → `useRecorder` arranca `watchPosition`; cada fix se agrega; `recorder` recalcula stats en vivo.
2. Terminar → arma un `SavedRoute kind:"recorded"` (geometry = track) y lo guarda; aparece en `RoutesSheet`.
3. Brújula/medir son overlays independientes que no tocan el estado del planner.

## Manejo de errores
GPS denegado → no se puede grabar, mensaje claro. `DeviceOrientation` no soportado/denegado → ocultar brújula.
App en background puede recortar `watchPosition` (limitación del navegador) → avisar que conviene pantalla activa (Wake Lock si está disponible).

## Testing (Vitest)
- `recorder`: stats con fixtures (distancia, moving vs total por umbral de velocidad, asc., max speed).
- `routeStore`: round-trip con `kind: "recorded"` + stats.
- `measure`: acumulación de distancia (vía haversine, ya testeado).
DeviceOrientation/watchPosition: no unit-test (hardware); verificación en navegador.

## Fases
1. Fix de círculos de radio + precisión (rápido, alto impacto).
2. `recorder` (módulo puro) + `useRecorder` + `RecorderControl` + guardado.
3. Stats en vivo y al guardar; marcar `kind` y mostrarlo en `RoutesSheet`.
4. Brújula.
5. Medir distancia.
