# naturoutes

Planificador de rutas de **bici y caminata** sobre un mapa. Web **100 % front**, sin
backend: toda la lógica corre en el navegador. Mobile-first e instalable como PWA.

🔗 **En vivo:** https://felipendelicia.github.io/naturoutes/

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Leaflet](https://img.shields.io/badge/Leaflet-OSM-green) ![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222)

## Qué hace

- 🗺️ **Mapa** Leaflet con capas conmutables: **calle / satélite / relieve / ciclovías**.
  Trackpad: dos dedos = pan, Ctrl+dos dedos = zoom · rueda del mouse = zoom.
- ✏️ **Trazado mixto** (auto vía [BRouter](https://brouter.de) con **fallback** a línea recta, o manual):
  perfiles **Bici (asfalto) / MTB / Caminar**, **rutas alternativas** para elegir,
  y **edición** de puntos (arrastrar, insertar en la línea, borrar con long-press, invertir).
- 📈 **Distancia, tiempo estimado, tipo de superficie** (% asfalto) y **perfil de elevación
  interactivo** (hover marca el punto en el mapa).
- 🧭 **Herramientas**: grabar tu recorrido con **GPS** (tracking + stats, guardado como ruta),
  **brújula**, **medir distancia** y **círculos de radio** desde tu ubicación.
- 📌 **POIs** (agua, refugios, bici) vía Overpass.
- 🔎 **Búsqueda de lugares** (Nominatim) ordenada por distancia a vos · 📍 **GPS** con auto-ubicar.
- 💾 **Guardado local** de rutas en IndexedDB · 📤 **Export/Import GPX**, **KML** y "Abrir en Google Maps".
- 📱 **PWA instalable** + **descarga de mapas por zona** para uso **offline** sin señal.

## Stack

Next.js 16 (App Router, `output: 'export'`) · React 19 · TypeScript strict · Tailwind v4 ·
Leaflet + react-leaflet · Vitest. Deploy estático en GitHub Pages.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # tests unitarios (lógica pura)
npm run lint       # ESLint
npm run build      # export estático -> out/
npx serve out      # servir el build local
```

> No usa servidor: `next start` no aplica con `output: 'export'`.

## Arquitectura

La lógica pura vive en `lib/` (framework-free, testeada con Vitest); la UI en `app/planner/`
(componentes client-only, el mapa toca `window`).

```
lib/
  geo/        haversine · elevación · geocoding · segmento (insertar)
  routing/    BRouter (+ alternativas, superficie) · manual · perfiles · dispatcher
  planner/    reducer de estado (incluye edición de waypoints)
  store/      persistencia (KV inyectable + backend IndexedDB)
  io/         export GPX/KML/Google Maps
  map/        capas base · matemática de tiles (offline)
  poi/        Overpass (puntos de interés)
  tracking/   stats de recorrido grabado
app/planner/  MapView + hooks (usePlanner, useGeolocation, useRecorder, useLayer,
              usePois, useOnline…) + controles de UI
docs/superpowers/  specs y planes (E1–E5)
```

## APIs externas (públicas, sin key)

| Servicio | Uso | Nota |
|----------|-----|------|
| OpenStreetMap / Esri / OpenTopoMap / CyclOSM | tiles base | atribución obligatoria |
| BRouter | ruteo + alternativas + elevación + superficie | API pública |
| Nominatim | búsqueda de lugares | máx 1 req/s; con debounce |
| Overpass (mirror Kumi) | POIs (agua, refugios, bici) | con debounce y límite de área |

## Deploy

Push a `main` → GitHub Actions (`.github/workflows/deploy.yml`) hace `npm run build` y
publica `out/` en Pages. En CI se setea `GITHUB_PAGES=true` para aplicar
`basePath: /naturoutes`; en local queda en root.

## Licencia

Datos de mapa © colaboradores de OpenStreetMap.
