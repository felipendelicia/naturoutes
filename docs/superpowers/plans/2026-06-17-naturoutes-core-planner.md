# naturoutes Core Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A usable mobile-first route planner: tap the map to build a bike/walk route (snap-to-roads via BRouter or straight-line manual), see total distance, with GPS centering — all client-side, deployed static to GitHub Pages.

**Architecture:** Pure logic modules under `lib/` (geo math, routing, planner reducer) are framework-free and unit-tested with Vitest. React client components under `app/planner/` (Leaflet map + mobile controls) are built with the frontend-design skill and verified via build + live deploy. The map subtree is loaded client-only (`next/dynamic`, `ssr:false`).

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), React 19, TypeScript (strict), Tailwind v4, Leaflet + react-leaflet v5, Vitest.

## Global Constraints

- Runtime: Node 24, package manager **npm**.
- Next.js static export (`output: 'export'`); no backend, no Route Handlers, no Server Actions.
- `basePath`/`assetPrefix` = `/naturoutes` only in CI (`GITHUB_PAGES=true`); local stays at root.
- Map and anything touching `window`/Leaflet must be client-only (`'use client'` + `next/dynamic` `ssr:false`).
- TypeScript strict; no `any`, no forced casts — fix the type.
- All external calls (BRouter) must tolerate failure → degrade to manual line, never throw to the UI.
- UI/styles built with the `frontend-design` skill.
- OSM tiles require visible attribution.
- Commits: no Claude/Anthropic attribution.
- Tests import pure modules via **relative paths** (no `@/*` alias in tests).

---

### Task 1: Shared types + Vitest + haversine distance

**Files:**
- Create: `lib/types.ts`
- Create: `lib/geo/haversine.ts`
- Create: `lib/geo/haversine.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` scripts + devDeps)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type LatLng = { lat: number; lng: number }`
  - `type RoutePoint = LatLng & { ele?: number }`
  - `type Profile = 'bike' | 'foot'`
  - `type Mode = 'auto' | 'manual'`
  - `type Route = { waypoints: LatLng[]; geometry: RoutePoint[]; distanceMeters: number; ascentMeters?: number; profile: Profile; mode: Mode; fallback?: boolean }`
  - `distance(a: LatLng, b: LatLng): number` (meters)
  - `totalDistance(points: LatLng[]): number` (meters)

- [ ] **Step 1: Install Vitest**

```bash
npm i -D vitest
```

- [ ] **Step 2: Add vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create shared types**

Create `lib/types.ts`:

```ts
export type LatLng = { lat: number; lng: number };
export type RoutePoint = LatLng & { ele?: number };
export type Profile = "bike" | "foot";
export type Mode = "auto" | "manual";

export type Route = {
  waypoints: LatLng[];
  geometry: RoutePoint[];
  distanceMeters: number;
  ascentMeters?: number;
  profile: Profile;
  mode: Mode;
  /** true when an auto route fell back to a straight line */
  fallback?: boolean;
};
```

- [ ] **Step 5: Write the failing test**

Create `lib/geo/haversine.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { distance, totalDistance } from "./haversine";

describe("distance", () => {
  it("returns 0 for the same point", () => {
    expect(distance({ lat: 40, lng: -3 }, { lat: 40, lng: -3 })).toBe(0);
  });

  it("approximates 1 degree of latitude as ~111 km", () => {
    const d = distance({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe("totalDistance", () => {
  it("returns 0 for fewer than 2 points", () => {
    expect(totalDistance([])).toBe(0);
    expect(totalDistance([{ lat: 1, lng: 1 }])).toBe(0);
  });

  it("sums segment distances", () => {
    const pts = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    const expected =
      distance(pts[0], pts[1]) + distance(pts[1], pts[2]);
    expect(totalDistance(pts)).toBeCloseTo(expected, 5);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./haversine`.

- [ ] **Step 7: Implement haversine**

Create `lib/geo/haversine.ts`:

```ts
import type { LatLng } from "../types";

const R = 6371000; // earth radius in meters

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function totalDistance(points: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += distance(points[i - 1], points[i]);
  }
  return sum;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add lib vitest.config.ts package.json package-lock.json
git commit -m "Agrega tipos compartidos, Vitest y distancia haversine"
```

---

### Task 2: Manual route builder

**Files:**
- Create: `lib/routing/manual.ts`
- Create: `lib/routing/manual.test.ts`

**Interfaces:**
- Consumes: `Route`, `LatLng`, `Profile` from `lib/types`; `totalDistance` from `lib/geo/haversine`.
- Produces: `buildManualRoute(waypoints: LatLng[], profile: Profile): Route`

- [ ] **Step 1: Write the failing test**

Create `lib/routing/manual.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildManualRoute } from "./manual";
import { totalDistance } from "../geo/haversine";

const wps = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
];

describe("buildManualRoute", () => {
  it("uses waypoints as geometry and haversine total distance", () => {
    const r = buildManualRoute(wps, "bike");
    expect(r.geometry).toEqual(wps);
    expect(r.distanceMeters).toBeCloseTo(totalDistance(wps), 5);
    expect(r.mode).toBe("manual");
    expect(r.profile).toBe("bike");
    expect(r.waypoints).toEqual(wps);
  });

  it("returns zero distance for a single waypoint", () => {
    const r = buildManualRoute([{ lat: 1, lng: 1 }], "foot");
    expect(r.distanceMeters).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./manual`.

- [ ] **Step 3: Implement buildManualRoute**

Create `lib/routing/manual.ts`:

```ts
import type { LatLng, Profile, Route } from "../types";
import { totalDistance } from "../geo/haversine";

export function buildManualRoute(
  waypoints: LatLng[],
  profile: Profile,
): Route {
  return {
    waypoints,
    geometry: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
    distanceMeters: totalDistance(waypoints),
    profile,
    mode: "manual",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/routing
git commit -m "Agrega builder de ruta manual (líneas rectas)"
```

---

### Task 3: BRouter client (parse + fetch)

**Files:**
- Create: `lib/routing/brouter.ts`
- Create: `lib/routing/brouter.test.ts`

**Interfaces:**
- Consumes: `Route`, `LatLng`, `Profile` from `lib/types`.
- Produces:
  - `BROUTER_PROFILE: Record<Profile, string>` = `{ bike: "trekking", foot: "hiking-mountain" }`
  - `parseBrouterGeoJSON(json: unknown, waypoints: LatLng[], profile: Profile): Route`
  - `fetchBrouterRoute(waypoints: LatLng[], profile: Profile, fetchImpl?: typeof fetch): Promise<Route>`

- [ ] **Step 1: Write the failing test**

Create `lib/routing/brouter.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { parseBrouterGeoJSON, fetchBrouterRoute } from "./brouter";

const sample = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { "track-length": "1500", "filtered ascend": "42" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7, 40.4, 600],
          [-3.69, 40.41, 610],
          [-3.68, 40.42, 605],
        ],
      },
    },
  ],
};

const wps = [
  { lat: 40.4, lng: -3.7 },
  { lat: 40.42, lng: -3.68 },
];

describe("parseBrouterGeoJSON", () => {
  it("maps [lng,lat,ele] coords to RoutePoints", () => {
    const r = parseBrouterGeoJSON(sample, wps, "bike");
    expect(r.geometry[0]).toEqual({ lat: 40.4, lng: -3.7, ele: 600 });
    expect(r.geometry).toHaveLength(3);
  });

  it("reads distance and ascent from properties", () => {
    const r = parseBrouterGeoJSON(sample, wps, "bike");
    expect(r.distanceMeters).toBe(1500);
    expect(r.ascentMeters).toBe(42);
    expect(r.mode).toBe("auto");
    expect(r.waypoints).toEqual(wps);
  });
});

describe("fetchBrouterRoute", () => {
  it("calls BRouter with lonlats + mapped profile and parses the response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    } as Response);

    const r = await fetchBrouterRoute(wps, "foot", fetchImpl as unknown as typeof fetch);

    const url = (fetchImpl.mock.calls[0][0] as string);
    expect(url).toContain("lonlats=-3.7,40.4|-3.68,40.42");
    expect(url).toContain("profile=hiking-mountain");
    expect(url).toContain("format=geojson");
    expect(r.distanceMeters).toBe(1500);
  });

  it("throws when the response is not ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(
      fetchBrouterRoute(wps, "bike", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./brouter`.

- [ ] **Step 3: Implement brouter client**

Create `lib/routing/brouter.ts`:

```ts
import type { LatLng, Profile, Route, RoutePoint } from "../types";

export const BROUTER_PROFILE: Record<Profile, string> = {
  bike: "trekking",
  foot: "hiking-mountain",
};

const ENDPOINT = "https://brouter.de/brouter";

type GeoJSONLike = {
  features?: Array<{
    properties?: Record<string, string>;
    geometry?: { coordinates?: number[][] };
  }>;
};

export function parseBrouterGeoJSON(
  json: unknown,
  waypoints: LatLng[],
  profile: Profile,
): Route {
  const data = json as GeoJSONLike;
  const feature = data.features?.[0];
  if (!feature?.geometry?.coordinates) {
    throw new Error("respuesta de BRouter sin geometría");
  }
  const geometry: RoutePoint[] = feature.geometry.coordinates.map(
    ([lng, lat, ele]) => ({ lat, lng, ele }),
  );
  const props = feature.properties ?? {};
  return {
    waypoints,
    geometry,
    distanceMeters: Number(props["track-length"] ?? 0),
    ascentMeters: props["filtered ascend"] !== undefined
      ? Number(props["filtered ascend"])
      : undefined,
    profile,
    mode: "auto",
  };
}

export async function fetchBrouterRoute(
  waypoints: LatLng[],
  profile: Profile,
  fetchImpl: typeof fetch = fetch,
): Promise<Route> {
  const lonlats = waypoints.map((w) => `${w.lng},${w.lat}`).join("|");
  const url =
    `${ENDPOINT}?lonlats=${lonlats}` +
    `&profile=${BROUTER_PROFILE[profile]}` +
    `&alternativeidx=0&format=geojson`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`BRouter respondió ${res.status}`);
  }
  return parseBrouterGeoJSON(await res.json(), waypoints, profile);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/routing/brouter.ts lib/routing/brouter.test.ts
git commit -m "Agrega cliente BRouter (parse + fetch) con perfiles bici/pie"
```

---

### Task 4: Routing dispatcher with fallback

**Files:**
- Create: `lib/routing/index.ts`
- Create: `lib/routing/index.test.ts`

**Interfaces:**
- Consumes: `buildManualRoute`, `fetchBrouterRoute`, `Route`, `LatLng`, `Mode`, `Profile`.
- Produces: `computeRoute(waypoints: LatLng[], opts: { mode: Mode; profile: Profile }, deps?: { fetchRoute?: typeof fetchBrouterRoute }): Promise<Route>`

Behaviour:
- `< 2` waypoints → empty route (`geometry = waypoints` copied, `distanceMeters = 0`, given `mode`/`profile`).
- `mode === "manual"` → `buildManualRoute`.
- `mode === "auto"` → try `fetchRoute`; on throw → `buildManualRoute` result with `fallback: true`.

- [ ] **Step 1: Write the failing test**

Create `lib/routing/index.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { computeRoute } from "./index";

const wps = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
];

describe("computeRoute", () => {
  it("returns an empty route for fewer than 2 waypoints", async () => {
    const r = await computeRoute([{ lat: 0, lng: 0 }], { mode: "auto", profile: "bike" });
    expect(r.distanceMeters).toBe(0);
    expect(r.geometry).toHaveLength(1);
  });

  it("uses manual builder in manual mode", async () => {
    const fetchRoute = vi.fn();
    const r = await computeRoute(wps, { mode: "manual", profile: "bike" }, { fetchRoute });
    expect(r.mode).toBe("manual");
    expect(fetchRoute).not.toHaveBeenCalled();
  });

  it("uses the auto router in auto mode", async () => {
    const fetchRoute = vi.fn().mockResolvedValue({
      waypoints: wps, geometry: wps, distanceMeters: 999, profile: "bike", mode: "auto",
    });
    const r = await computeRoute(wps, { mode: "auto", profile: "bike" }, { fetchRoute });
    expect(r.distanceMeters).toBe(999);
    expect(fetchRoute).toHaveBeenCalledOnce();
  });

  it("falls back to a manual line when the auto router throws", async () => {
    const fetchRoute = vi.fn().mockRejectedValue(new Error("down"));
    const r = await computeRoute(wps, { mode: "auto", profile: "bike" }, { fetchRoute });
    expect(r.mode).toBe("manual");
    expect(r.fallback).toBe(true);
    expect(r.distanceMeters).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Implement the dispatcher**

Create `lib/routing/index.ts`:

```ts
import type { LatLng, Mode, Profile, Route } from "../types";
import { buildManualRoute } from "./manual";
import { fetchBrouterRoute } from "./brouter";

type Deps = { fetchRoute?: typeof fetchBrouterRoute };

export async function computeRoute(
  waypoints: LatLng[],
  opts: { mode: Mode; profile: Profile },
  deps: Deps = {},
): Promise<Route> {
  const { mode, profile } = opts;

  if (waypoints.length < 2) {
    return {
      waypoints,
      geometry: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
      distanceMeters: 0,
      profile,
      mode,
    };
  }

  if (mode === "manual") {
    return buildManualRoute(waypoints, profile);
  }

  const fetchRoute = deps.fetchRoute ?? fetchBrouterRoute;
  try {
    return await fetchRoute(waypoints, profile);
  } catch {
    return { ...buildManualRoute(waypoints, profile), fallback: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/routing/index.ts lib/routing/index.test.ts
git commit -m "Agrega dispatcher de ruteo con fallback auto→manual"
```

---

### Task 5: Planner reducer

**Files:**
- Create: `lib/planner/reducer.ts`
- Create: `lib/planner/reducer.test.ts`

**Interfaces:**
- Consumes: `LatLng`, `Mode`, `Profile`.
- Produces:
  - `type PlannerState = { waypoints: LatLng[]; mode: Mode; profile: Profile }`
  - `type PlannerAction = { type: "add"; point: LatLng } | { type: "undo" } | { type: "clear" } | { type: "setMode"; mode: Mode } | { type: "setProfile"; profile: Profile }`
  - `initialPlannerState: PlannerState` (`{ waypoints: [], mode: "auto", profile: "bike" }`)
  - `plannerReducer(state: PlannerState, action: PlannerAction): PlannerState`

- [ ] **Step 1: Write the failing test**

Create `lib/planner/reducer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { plannerReducer, initialPlannerState } from "./reducer";

const p = { lat: 1, lng: 1 };

describe("plannerReducer", () => {
  it("adds a waypoint", () => {
    const s = plannerReducer(initialPlannerState, { type: "add", point: p });
    expect(s.waypoints).toEqual([p]);
  });

  it("undo removes the last waypoint", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: p });
    s = plannerReducer(s, { type: "add", point: { lat: 2, lng: 2 } });
    s = plannerReducer(s, { type: "undo" });
    expect(s.waypoints).toEqual([p]);
  });

  it("undo on empty is a no-op", () => {
    const s = plannerReducer(initialPlannerState, { type: "undo" });
    expect(s.waypoints).toEqual([]);
  });

  it("clear removes all waypoints but keeps mode/profile", () => {
    let s = plannerReducer(initialPlannerState, { type: "add", point: p });
    s = plannerReducer(s, { type: "setProfile", profile: "foot" });
    s = plannerReducer(s, { type: "clear" });
    expect(s.waypoints).toEqual([]);
    expect(s.profile).toBe("foot");
  });

  it("sets mode and profile", () => {
    let s = plannerReducer(initialPlannerState, { type: "setMode", mode: "manual" });
    s = plannerReducer(s, { type: "setProfile", profile: "foot" });
    expect(s.mode).toBe("manual");
    expect(s.profile).toBe("foot");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./reducer`.

- [ ] **Step 3: Implement the reducer**

Create `lib/planner/reducer.ts`:

```ts
import type { LatLng, Mode, Profile } from "../types";

export type PlannerState = {
  waypoints: LatLng[];
  mode: Mode;
  profile: Profile;
};

export type PlannerAction =
  | { type: "add"; point: LatLng }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "setMode"; mode: Mode }
  | { type: "setProfile"; profile: Profile };

export const initialPlannerState: PlannerState = {
  waypoints: [],
  mode: "auto",
  profile: "bike",
};

export function plannerReducer(
  state: PlannerState,
  action: PlannerAction,
): PlannerState {
  switch (action.type) {
    case "add":
      return { ...state, waypoints: [...state.waypoints, action.point] };
    case "undo":
      return { ...state, waypoints: state.waypoints.slice(0, -1) };
    case "clear":
      return { ...state, waypoints: [] };
    case "setMode":
      return { ...state, mode: action.mode };
    case "setProfile":
      return { ...state, profile: action.profile };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/planner
git commit -m "Agrega reducer del planner (waypoints, modo, perfil)"
```

---

### Task 6: useGeolocation hook + usePlanner hook

**Files:**
- Create: `app/planner/useGeolocation.ts`
- Create: `app/planner/usePlanner.ts`

**Interfaces:**
- Consumes: `plannerReducer`, `initialPlannerState`, `PlannerState`; `computeRoute`; `Route`, `LatLng`.
- Produces:
  - `useGeolocation(): { position: LatLng | null; error: string | null; locate: () => void }`
  - `usePlanner(): { state: PlannerState; route: Route | null; loading: boolean; addWaypoint: (p: LatLng) => void; undo: () => void; clear: () => void; setMode: (m: Mode) => void; setProfile: (p: Profile) => void }`

These are async/effectful React hooks — verified via the app build and live behaviour, not unit tests.

- [ ] **Step 1: Implement useGeolocation**

Create `app/planner/useGeolocation.ts`:

```ts
"use client";

import { useCallback, useState } from "react";
import type { LatLng } from "@/lib/types";

export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalización no disponible");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      () => setError("No se pudo obtener tu ubicación"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { position, error, locate };
}
```

- [ ] **Step 2: Implement usePlanner**

Create `app/planner/usePlanner.ts`:

```ts
"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { LatLng, Mode, Profile, Route } from "@/lib/types";
import { computeRoute } from "@/lib/routing";
import {
  initialPlannerState,
  plannerReducer,
} from "@/lib/planner/reducer";

export function usePlanner() {
  const [state, dispatch] = useReducer(plannerReducer, initialPlannerState);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      computeRoute(state.waypoints, { mode: state.mode, profile: state.profile })
        .then((r) => {
          if (id === reqId.current) setRoute(r);
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [state.waypoints, state.mode, state.profile]);

  return {
    state,
    route,
    loading,
    addWaypoint: (p: LatLng) => dispatch({ type: "add", point: p }),
    undo: () => dispatch({ type: "undo" }),
    clear: () => dispatch({ type: "clear" }),
    setMode: (m: Mode) => dispatch({ type: "setMode", mode: m }),
    setProfile: (p: Profile) => dispatch({ type: "setProfile", profile: p }),
  };
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/planner/useGeolocation.ts app/planner/usePlanner.ts
git commit -m "Agrega hooks usePlanner y useGeolocation"
```

---

### Task 7: MapView component (Leaflet)

**Files:**
- Create: `app/planner/MapView.tsx`
- Modify: `package.json` (add `leaflet`, `react-leaflet`, `@types/leaflet`)

**Interfaces:**
- Consumes: `Route`, `LatLng`.
- Produces: default export `MapView` with props `{ route: Route | null; waypoints: LatLng[]; userPosition: LatLng | null; onMapClick: (p: LatLng) => void; center: LatLng; zoom: number }`.

Uses `CircleMarker` for waypoints and user position (no marker-icon asset wrangling). OSM tiles with attribution. `useMapEvents` for clicks. A `RecenterOnUser` helper pans when `userPosition` changes.

Build this component's styling/markup with the **frontend-design** skill.

- [ ] **Step 1: Install Leaflet**

```bash
npm i leaflet react-leaflet && npm i -D @types/leaflet
```

- [ ] **Step 2: Implement MapView**

Create `app/planner/MapView.tsx`:

```tsx
"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLng, Route } from "@/lib/types";

function ClickHandler({ onMapClick }: { onMapClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterOnUser({ position }: { position: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 15);
  }, [position, map]);
  return null;
}

export default function MapView({
  route,
  waypoints,
  userPosition,
  onMapClick,
  center,
  zoom,
}: {
  route: Route | null;
  waypoints: LatLng[];
  userPosition: LatLng | null;
  onMapClick: (p: LatLng) => void;
  center: LatLng;
  zoom: number;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onMapClick={onMapClick} />
      <RecenterOnUser position={userPosition} />

      {route && route.geometry.length >= 2 && (
        <Polyline
          positions={route.geometry.map((p) => [p.lat, p.lng])}
          pathOptions={{ weight: 5 }}
        />
      )}

      {waypoints.map((w, i) => (
        <CircleMarker
          key={i}
          center={[w.lat, w.lng]}
          radius={6}
          pathOptions={{ fillOpacity: 1 }}
        />
      ))}

      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={8}
          pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.9 }}
        />
      )}
    </MapContainer>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/planner/MapView.tsx package.json package-lock.json
git commit -m "Agrega MapView con Leaflet (tiles OSM, polyline, waypoints, GPS)"
```

---

### Task 8: PlannerApp shell + page wiring

**Files:**
- Create: `app/planner/PlannerApp.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css` (ensure full-height layout)
- Modify: `app/layout.tsx` (metadata title/description)

**Interfaces:**
- Consumes: `usePlanner`, `useGeolocation`, `MapView`.
- Produces: default export `PlannerApp` (no props). `app/page.tsx` renders it via `next/dynamic` `ssr:false`.

Build the controls/layout with the **frontend-design** skill: mobile-first, a top bar (app name + bike/foot toggle + auto/manual toggle), a floating GPS button, a bottom panel showing distance (and ascent if present) with undo/clear, and a non-blocking toast when `route.fallback` is true. Default map center: Madrid `{ lat: 40.4168, lng: -3.7038 }`, zoom 13.

- [ ] **Step 1: Implement PlannerApp**

Create `app/planner/PlannerApp.tsx` (baseline below; refine visuals with frontend-design):

```tsx
"use client";

import { usePlanner } from "./usePlanner";
import { useGeolocation } from "./useGeolocation";
import MapView from "./MapView";

const CENTER = { lat: 40.4168, lng: -3.7038 };

function formatKm(m: number): string {
  return `${(m / 1000).toFixed(2)} km`;
}

export default function PlannerApp() {
  const planner = usePlanner();
  const geo = useGeolocation();
  const { state, route, loading } = planner;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView
          route={route}
          waypoints={state.waypoints}
          userPosition={geo.position}
          onMapClick={planner.addWaypoint}
          center={geo.position ?? CENTER}
          zoom={13}
        />
      </div>

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center gap-2 p-3">
        <span className="font-semibold">naturoutes</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => planner.setProfile(state.profile === "bike" ? "foot" : "bike")}
            className="rounded bg-white/90 px-3 py-1 shadow"
          >
            {state.profile === "bike" ? "🚲 Bici" : "🥾 Pie"}
          </button>
          <button
            onClick={() => planner.setMode(state.mode === "auto" ? "manual" : "auto")}
            className="rounded bg-white/90 px-3 py-1 shadow"
          >
            {state.mode === "auto" ? "Auto" : "Manual"}
          </button>
        </div>
      </div>

      {/* GPS button */}
      <button
        onClick={geo.locate}
        className="absolute bottom-28 right-3 z-[1000] rounded-full bg-white/90 p-3 shadow"
        aria-label="Mi ubicación"
      >
        📍
      </button>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center gap-3 bg-white/95 p-4 shadow">
        <div>
          <div className="text-lg font-semibold">
            {route ? formatKm(route.distanceMeters) : "0.00 km"}
          </div>
          {route?.ascentMeters != null && (
            <div className="text-sm text-gray-500">↑ {Math.round(route.ascentMeters)} m</div>
          )}
          {loading && <div className="text-xs text-gray-400">calculando…</div>}
          {route?.fallback && (
            <div className="text-xs text-amber-600">ruta automática no disponible, usando línea recta</div>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={planner.undo} className="rounded border px-3 py-2">Deshacer</button>
          <button onClick={planner.clear} className="rounded border px-3 py-2">Limpiar</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the page (client-only)**

Replace `app/page.tsx` with:

```tsx
import dynamic from "next/dynamic";

const PlannerApp = dynamic(() => import("./planner/PlannerApp"), { ssr: false });

export default function Home() {
  return <PlannerApp />;
}
```

Note: `ssr: false` in a Server Component is not allowed in Next 16. If `next build` errors on this, add `"use client";` as the first line of `app/page.tsx`.

- [ ] **Step 3: Ensure full-height layout**

In `app/globals.css`, ensure `html, body` allow full height (add if missing):

```css
html,
body {
  height: 100%;
  margin: 0;
}
```

- [ ] **Step 4: Update metadata**

In `app/layout.tsx`, set:

```ts
export const metadata = {
  title: "naturoutes",
  description: "Planificá rutas de bici y caminata sobre el mapa.",
};
```

- [ ] **Step 5: Verify build (static export)**

Run: `npm run build`
Expected: build succeeds; `out/index.html` exists.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all unit tests PASS.

- [ ] **Step 7: Commit**

```bash
git add app
git commit -m "Conecta PlannerApp: mapa + controles mobile + distancia + GPS"
```

---

### Task 9: Deploy verification

**Files:** none (CI deploy).

- [ ] **Step 1: Push and confirm Pages deploy**

```bash
git push
```

- [ ] **Step 2: Wait for the workflow and verify the live site**

Run: `gh run watch --repo felipendelicia/naturoutes --exit-status`
Then: `curl -s -o /dev/null -w "%{http_code}\n" https://felipendelicia.github.io/naturoutes/`
Expected: `200`, and the map renders with controls on a phone-sized viewport.

---

## Self-Review

**Spec coverage (Phases 1–3 + GPS):**
- Map + OSM tiles → Task 7. ✓
- Geolocation centering → Task 6 (`useGeolocation`) + Task 7 (`RecenterOnUser`). ✓
- Manual routing (tap waypoints, polyline, haversine distance, undo/clear) → Tasks 1,2,5,8. ✓
- Auto routing (BRouter, bike/foot, auto/manual toggle, fallback) → Tasks 3,4,8. ✓
- Mobile-first UI → Task 8 (frontend-design). ✓
- Static export + basePath deploy → existing config + Task 9. ✓
- Phases 4–8 (elevation chart, search, persistence, export, PWA) → intentionally deferred to follow-up plans. `ascentMeters` is already captured for the future elevation chart.

**Placeholder scan:** none — every code step has full code.

**Type consistency:** `Route`, `LatLng`, `RoutePoint`, `Profile`, `Mode` defined in Task 1 and used unchanged throughout; `computeRoute`, `buildManualRoute`, `fetchBrouterRoute`, `plannerReducer`, `usePlanner`, `MapView` signatures match across consuming tasks. ✓
