# UX/UI Overhaul + Paradas reordenables (spec)

Fecha: 2026-06-18 · Estado: aprobado (brainstorming) · App: naturoutes (front-only, sin backend)

## Propósito
Rediseñar la experiencia: pasar de un "FAB soup" (≈7 botones flotantes dispersos) a un
**bottom-sheet hub** estilo Google Maps/Komoot, con jerarquía clara, ergonomía a una mano y
estética pulida. Sumar **paradas reordenables y fáciles de editar** y **"partir de mi ubicación"**.

Es una **re-arquitectura de UI**: se conservan TODAS las features y la lógica. `lib/` casi no
se toca (solo se agrega `reorder` al reducer y `reverseGeocode`). El grueso del cambio está en
`app/planner/`. La UI se construye con el skill **frontend-design**.

## Principios
- El mapa es la estrella (pantalla completa); el resto vive en una hoja inferior.
- **Un solo FAB**: GPS/ubicación. Nada de stacks de botones en los bordes.
- Lo frecuente al alcance del pulgar (abajo); arriba solo búsqueda y capas.
- Una sola fuente de verdad para los waypoints: mapa, lista de paradas y edición operan sobre ella.

## Arquitectura (componentes)
Nuevos en `app/planner/`:
- **`BottomSheet.tsx`** — primitivo arrastrable con snap points (peek / media / full). Drag por el
  handle (pointer events), animación de snap, respeta `prefers-reduced-motion`. Controlado por
  un estado de altura; expone `snap` y `setSnap`.
- **`RouteSheet.tsx`** — contenido de la hoja principal. Estados:
  - *Vacío*: CTA **"📍 Partir de mi ubicación"** + hint "tocá el mapa".
  - *Con ruta*: resumen (distancia · tiempo · ↑ascenso), **perfil** (Bici/MTB/Caminar), **modo**
    (auto/manual), **chips de alternativas**, **lista de paradas**, **perfil de elevación
    interactivo**, acciones (Guardar, menú ⋯ con export/import/invertir/Google Maps), y entrada a
    **Herramientas**.
- **`StopsList.tsx`** — lista de paradas reordenable (ver sección Paradas).
- **`ToolsSheet.tsx`** — hoja secundaria con brújula, medir, círculos de radio y grabar recorrido
  (reusa `useCompass`, `useRecorder`, la lógica de medición y `RadiusControl`). Se abre desde
  `RouteSheet`. Al grabar, una **barra de stats arriba** + stop/pausa permite colapsar la hoja.
- **`TopBar.tsx`** — wordmark compacto + `SearchBox` prominente + `LayerSwitcher`.

Se **eliminan los wrappers FAB** absolutos de `CompassControl`/`MeasureControl`/`RadiusControl`/
`RecorderControl` (su lógica se reubica como contenido de `ToolsSheet`). `PlannerApp` deja de
posicionar stacks; orquesta `TopBar` + `MapView` + el FAB de GPS + `BottomSheet(RouteSheet)` +
`ToolsSheet` + overlays (RoutesSheet, OfflinePanel, toasts).

## Paradas (estilo Google Maps)
Fuente de verdad: `state.waypoints` (sin cambiar el tipo `LatLng[]` para routing).

- **`StopsList`**: filas origen → paradas → destino (A · B · C…). Cada fila:
  - **Reordenar**: drag handle con **pointer events** (sin librería) → al soltar, `reorder(from,to)`
    y recálculo. Fallback accesible: botones **↑ / ↓** por fila (siempre presentes para touch fiable).
  - **Etiqueta** vía `useStopLabels(waypoints, originKey)`: "Mi ubicación" si el coord es el origen
    de GPS; si no, nombre por **reverse-geocoding** (Nominatim, *lazy*, debounce, **cacheado por
    coord redondeado**, respeta 1 req/s); mientras carga, "Parada N".
  - **Quitar** (✕) → `removeAt(i)`. **Tocar la fila** → centra el mapa en esa parada (vía `flyTo`).
  - **"+ Agregar parada"** → próximo toque en el mapa agrega al final (comportamiento ya existente).
- **Sincronización**: arrastrar el marcador (`move`), insertar tocando la línea (`insert`),
  reordenar/quitar en la lista — todo sobre `state.waypoints`. Las etiquetas siguen al **coord**
  (cache keyed por coord), así sobreviven al reordenamiento sin taggear el waypoint.

### Cambios de lógica
- `lib/planner/reducer.ts`: nueva acción `{ type: "reorder"; from: number; to: number }`.
- `lib/geo/geocoding.ts`: `reverseGeocode(p: LatLng, fetchImpl?) => Promise<string | null>`
  (Nominatim `/reverse?format=json&lat&lon`), con `parseReverse(json)` puro.

## "Partir de mi ubicación"
- CTA en el estado vacío de `RouteSheet`. Al tocarla: si no hay fix, dispara `geo.locate()`; cuando
  hay posición, `addWaypoint(geo.position)` y se registra ese coord como **origen-ubicación**
  (un coord-key en `PlannerApp`), para que `useStopLabels` lo muestre como "Mi ubicación".
- Si el coord-origen se reordena, la etiqueta lo sigue (lookup por coord).

## Jerarquía + pulido (P-final)
- Escala tipográfica clara: distancia hero (mono), meta secundaria, labels terciarios.
- Espaciado y paleta outdoor existentes, refinados; consistencia de radios/sombras (`.panel`).
- **Estados**: skeleton en la hoja mientras rutea; toasts unificados (fallback, GPS, offline,
  Overpass); empty/loading/error prolijos.
- Micro-interacciones: snap de la hoja, presión de botones, drop de marcador, reorder con feedback.

## Ergonomía
Hoja + FAB GPS abajo (pulgar). Arriba solo búsqueda/capas (menos frecuente). Targets ≥44px.
Drag de la hoja y de las paradas con `touch-action` correcto para no pelear con el scroll.

## Manejo de errores
Reverse-geocoding falla/rate-limited → mantener "Parada N" (no romper). Sin GPS al "partir de mi
ubicación" → mensaje y quedarse esperando el fix. Reorder con <2 paradas → no-op.

## Testing (Vitest, módulos puros)
- `reducer`: `reorder` (mover de i→j, límites, no-op).
- `geocoding.parseReverse`: arma label desde respuesta Nominatim (con fixture); `reverseGeocode`
  llama a `/reverse` con lat/lon y parsea; throw/empty graceful.
- Lógica de `useStopLabels` extraída a una fn pura `stopLabel(coordKey, originKey, cache)` testeable.
- BottomSheet / drag-reorder / sheets: verificación en navegador (CDP) — no unit-test de DOM.

## Fases
1. **`BottomSheet` + `RouteSheet`**: primitivo de hoja con snaps; mover resumen, perfil, modo,
   alternativas, elevación y acciones a la hoja; reemplazar el panel-instrumento actual. GPS sigue como FAB.
2. **`StopsList`**: reducer `reorder`, `reverseGeocode` + `useStopLabels`, lista con drag/↑↓, quitar,
   centrar, agregar; sincronizada con el mapa.
3. **"Partir de mi ubicación"**: CTA + origen-ubicación + etiqueta "Mi ubicación".
4. **`ToolsSheet`**: consolidar brújula/medir/radio/grabar; eliminar los stacks de FABs.
5. **`TopBar`**: búsqueda prominente + capas + wordmark compacto; sacar perfil/modo de arriba (ya en la hoja).
6. **Pulido**: estados, micro-interacciones, tipografía/espaciado, toasts unificados.

## Fuera de alcance
Cambios en la lógica de ruteo/offline/POIs/tracking (solo se reubica su UI). Modo navegación
turn-by-turn (E5, descartado). Cuentas/sync (sigue sin backend).
