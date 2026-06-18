# naturoutes

App web **100% front (estática, sin backend)** para planificar rutas de bici/caminata
sobre un mapa. Mobile-first, instalable como PWA.

## Stack
- Next.js (App Router) + TypeScript + React, **static export** (`output: 'export'`) — no hay servidor ni API propia.
- Gestor de paquetes: **npm** (lockfile único; no usar pnpm/yarn/bun).
- Mapa: **Leaflet + react-leaflet** con tiles de OpenStreetMap (sin token ni cuenta).
- UI: **Tailwind CSS**, mobile-first.
- Deploy: **GitHub Pages** (sitio estático, *project page* → `basePath`/`assetPrefix` = `/naturoutes`).

## Scaffold inicial (una vez)
```bash
npx create-next-app@latest . --ts --app --tailwind --eslint --use-npm
```

## Comandos
```bash
npm run dev      # local en http://localhost:3000
npm run build    # build estático -> out/
npm run lint     # ESLint (+ "typecheck": "tsc --noEmit" si se añade)
npx serve out    # servir el export local (next start NO aplica con output: export)
```
Deploy: push a `main` → workflow de GitHub Actions (`actions/deploy-pages`) corre `npm run build` y publica `out/`.

## Dominio / decisiones
- **Ruteo mixto** con toggle:
  - *Auto*: click en puntos → snap a caminos según perfil bici/pie, vía API pública **BRouter** (gratis, **devuelve elevación**). OSRM como fallback.
  - *Manual*: polilínea de waypoints (líneas rectas).
- **Perfil de elevación** y distancia total: desde la respuesta de BRouter.
- **Persistencia (sin servidor)**: rutas en **IndexedDB**; **export/import GPX**; "Abrir en Google Maps" vía URL de direcciones + export **KML** (Maps no importa GPX directo).
- **GPS**: `navigator.geolocation` para centrar en la posición actual.
- **Geocoding**: búsqueda de lugares con **Nominatim** (OSM, sin key).
- **PWA**: manifest + service worker; instalable; caching offline de app shell + tiles vistos.

## Convenciones
- Para cualquier estilo/UI/componente front, usar el skill **frontend-design** (no maquetar a mano sin él).
- Componentes de mapa SIEMPRE client-only: `next/dynamic` con `{ ssr: false }` (Leaflet toca `window`).
- Server Components por defecto; `"use client"` solo donde haya estado/efectos/DOM/mapa.
- Sin backend: cero secretos en el cliente. Las APIs externas (BRouter/Nominatim) se llaman directo desde el navegador.
- Toda llamada externa tolera fallo/offline (es PWA): si el ruteo auto falla, degradar a modo manual.
- TypeScript strict; nada de `any` ni casts forzados — arreglar el tipo.
- Commits sin atribución a Claude/Anthropic.

## Gotchas
- `output: 'export'` desactiva SSR, Route Handlers y la optimización de `next/image` → setear `images.unoptimized: true`.
- GitHub Pages (project page): `basePath`/`assetPrefix` = `/naturoutes` en `next.config`, y agregar un archivo vacío `.nojekyll` en `out/` (si no, Pages ignora `_next/`).
- Con `basePath`, el `manifest` (`start_url`/`scope`) y el service worker de la PWA deben vivir bajo `/naturoutes/`, o la instalación/offline rompe. Mismo cuidado con links internos y assets.
- Nominatim/BRouter son APIs públicas: respetar rate limits (Nominatim 1 req/s + User-Agent propio), throttlear y cachear resultados.
- Leaflet usa `[lat, lng]`; GPX/GeoJSON usan `[lng, lat]` → convertir al importar/exportar.
- Google Maps no importa GPX directo: usar link de direcciones (máx ~10 waypoints) o KML para Google My Maps.
