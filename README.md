# naturoutes

Planificador de rutas de **bici y caminata** sobre un mapa. Web **100 % front**, sin
backend: toda la lógica corre en el navegador. Mobile-first e instalable como PWA.

🔗 **En vivo:** https://felipendelicia.github.io/naturoutes/

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Leaflet](https://img.shields.io/badge/Leaflet-OSM-green) ![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222)

## Qué hace

- 🗺️ **Mapa** Leaflet + OpenStreetMap (sin API key). En trackpad: dos dedos = pan, pinch = zoom.
- ✏️ **Trazado mixto**: tocá el mapa para agregar puntos.
  - *Auto*: la ruta se ajusta a caminos según perfil **bici/pie** (vía [BRouter](https://brouter.de)), con **fallback** a línea recta si falla.
  - *Manual*: líneas rectas entre puntos.
- 📈 **Distancia** y **perfil de elevación** (altimetría desde BRouter).
- 🔎 **Búsqueda de lugares** (Nominatim), ordenada por distancia a tu ubicación.
- 📍 **GPS** para centrar en tu posición.
- 💾 **Guardado local** de rutas en IndexedDB (sin servidor).
- 📤 **Export GPX/KML** e **importar GPX**, más "Abrir en Google Maps".
- 📱 **PWA instalable** con caché offline del app shell y los tiles vistos.

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
  geo/        haversine · elevación · geocoding
  routing/    BRouter · manual · dispatcher con fallback
  planner/    reducer de estado
  store/      persistencia (KV inyectable + backend IndexedDB)
  io/         export GPX/KML/Google Maps
app/planner/  MapView, hooks (usePlanner, useGeolocation, useSavedRoutes) y UI
docs/superpowers/  spec y plan de implementación
```

## APIs externas (públicas, sin key)

| Servicio | Uso | Nota |
|----------|-----|------|
| OpenStreetMap tiles | mapa base | atribución obligatoria |
| BRouter | ruteo bici/pie + elevación | API pública |
| Nominatim | búsqueda de lugares | máx 1 req/s; con debounce |

## Deploy

Push a `main` → GitHub Actions (`.github/workflows/deploy.yml`) hace `npm run build` y
publica `out/` en Pages. En CI se setea `GITHUB_PAGES=true` para aplicar
`basePath: /naturoutes`; en local queda en root.

## Licencia

Datos de mapa © colaboradores de OpenStreetMap.
