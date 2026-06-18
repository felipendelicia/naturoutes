# E5 · Modo navegación (turn-by-turn) (spec)

Fecha: 2026-06-17 · Estado: aprobado (roadmap) · App: naturoutes (front-only, sin backend)
Depende de: E1 (instrucciones de giro de BRouter).

## Propósito
Seguir una ruta planificada en vivo, estilo Google Maps: ver la próxima indicación y la
distancia al giro, con el mapa siguiendo tu posición, detección de desvío y recálculo.

## En alcance
- **Modo navegación**: se entra desde una ruta activa; el mapa se centra y orienta a tu posición
  (seguimiento), oculta el chrome de edición y muestra un banner con la **próxima maniobra** + distancia.
- **Instrucciones**: de los `voicehints` de BRouter (pedir el formato con hints); mapear a textos
  ("girá a la derecha", "seguí derecho", etc.) e íconos.
- **Progreso**: punto más cercano sobre la polyline → distancia recorrida, restante y ETA.
- **Detección de desvío**: si la distancia a la polyline supera un umbral (p.ej. 40 m) por N lecturas,
  se marca "fuera de ruta" y se **recalcula** desde la posición actual al destino (BRouter), con throttle.
- **Wake Lock**: mantener la pantalla activa mientras se navega (si está disponible).
- **Voz opcional**: leer la próxima maniobra con `speechSynthesis` (toggle).

## Fuera de alcance
Navegación sin una ruta previa (search-to-navigate), tráfico, carriles, navegación por voz avanzada.

## Arquitectura
- `lib/nav/progress.ts` (nuevo, puro): `nearestOnRoute(geometry, pos) => { index, distanceToRoute, along }`,
  `remaining(geometry, along) => meters`, `isOffRoute(distanceToRoute, threshold)`. Geometría pura, testeable.
- `lib/nav/maneuvers.ts` (nuevo, puro): `parseVoicehints(brouterResp) => Maneuver[]`
  (`Maneuver = { atIndex, type, text }`) y `nextManeuver(maneuvers, currentIndex) => Maneuver | null`.
- `lib/routing/brouter.ts`: pedir voicehints (parámetro de formato) y exponerlos en la respuesta.
- `app/planner/useNavigation.ts` (nuevo): toma la ruta + `watchPosition`, calcula progreso/próxima maniobra,
  dispara recálculo por desvío (usa `computeRoute`), maneja Wake Lock y voz.
- `app/planner/NavView.tsx` (nuevo): UI de navegación (banner de maniobra, distancia/ETA, salir).
- `app/planner/MapView.tsx`: modo seguimiento (centrar en cada fix; opcional rotar según rumbo).

## Flujo de datos
1. Entrar a navegación con la ruta activa (su geometría + maniobras).
2. `watchPosition` → `progress.nearestOnRoute` → distancia restante/ETA + `maneuvers.nextManeuver`.
3. Si `isOffRoute` sostenido → `computeRoute(posActual→destino, perfil)` (throttle) → nueva ruta/maniobras.
4. Wake Lock activo; si voz ON, anunciar la maniobra al acercarse.

## Manejo de errores
GPS denegado → no se puede navegar. Sin voicehints → mostrar solo distancia/seguimiento (sin texto de giro).
Recálculo sin red → mantener la ruta vieja + aviso "sin conexión". Wake Lock no soportado → seguir sin él.

## Testing (Vitest)
- `progress.nearestOnRoute`: proyección a polyline con fixtures (punto sobre, al costado, en un vértice).
- `progress.remaining` / `isOffRoute`: casos límite.
- `maneuvers.parseVoicehints` / `nextManeuver`: con fixture de respuesta BRouter.
watchPosition/WakeLock/voz/seguimiento: verificación en navegador (geolocation override por CDP).

## Fases
1. Geometría de progreso (`lib/nav/progress.ts`) con TDD.
2. Maniobras (`lib/nav/maneuvers.ts` + voicehints en BRouter) con TDD.
3. `useNavigation` + `NavView` + modo seguimiento del mapa.
4. Detección de desvío + recálculo (throttle).
5. Wake Lock + voz opcional.
