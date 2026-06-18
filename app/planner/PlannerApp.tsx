"use client";

import { usePlanner } from "./usePlanner";
import { useGeolocation } from "./useGeolocation";
import MapView from "./MapView";
import ElevationProfile from "./ElevationProfile";
import type { Mode, Profile } from "@/lib/types";

const CENTER = { lat: 40.4168, lng: -3.7038 }; // Madrid

function formatDistance(m: number): { value: string; unit: string } {
  if (m < 1000) return { value: Math.round(m).toString(), unit: "m" };
  return { value: (m / 1000).toFixed(m < 10000 ? 2 : 1), unit: "km" };
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-full bg-pine/8 p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              active
                ? "bg-blaze text-paper shadow-sm"
                : "text-pine-soft hover:text-pine"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PlannerApp() {
  const planner = usePlanner();
  const geo = useGeolocation();
  const { state, route, loading } = planner;

  const dist = formatDistance(route?.distanceMeters ?? 0);
  const hasRoute = state.waypoints.length > 0;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-paper-deep">
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

      {/* ── Top bar ───────────────────────────────────────── */}
      <header className="animate-drop pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-center justify-between gap-3 p-3">
        <div className="panel pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="shrink-0"
          >
            <path
              d="M3 17c4-1 5-9 9-9s5 5 9 4"
              stroke="var(--moss)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M3 13c4-1 5-7 9-7s5 4 9 3"
              stroke="var(--pine)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="15" cy="6.5" r="2.4" fill="var(--blaze)" />
          </svg>
          <span
            className="text-[15px] font-bold uppercase tracking-[0.18em] text-pine"
            style={{ fontStretch: "118%" }}
          >
            naturoutes
          </span>
        </div>

        <div className="panel pointer-events-auto rounded-2xl px-1.5 py-1.5">
          <Segmented<Profile>
            label="Actividad"
            value={state.profile}
            onChange={planner.setProfile}
            options={[
              { value: "bike", label: "Bici" },
              { value: "foot", label: "Pie" },
            ]}
          />
        </div>
      </header>

      {/* ── Empty-state hint ──────────────────────────────── */}
      {!hasRoute && (
        <div className="animate-rise pointer-events-none absolute inset-x-0 bottom-44 z-[900] flex justify-center px-6">
          <p className="panel rounded-full px-4 py-2 text-center text-xs font-medium text-pine-soft">
            Tocá el mapa para trazar tu ruta
          </p>
        </div>
      )}

      {/* ── GPS button ────────────────────────────────────── */}
      <button
        onClick={geo.locate}
        aria-label="Centrar en mi ubicación"
        className="panel animate-rise absolute bottom-44 right-3 z-[1000] grid h-12 w-12 place-items-center rounded-full text-pine transition active:scale-95"
        style={{ animationDelay: "0.1s" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3.2" fill="var(--blaze)" />
          <circle
            cx="12"
            cy="12"
            r="7"
            stroke="var(--pine)"
            strokeWidth="1.6"
          />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3"
            stroke="var(--pine)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* ── Geolocation error toast ───────────────────────── */}
      {geo.error && (
        <div className="absolute inset-x-0 bottom-40 z-[1100] flex justify-center px-6">
          <p className="animate-rise rounded-full bg-pine px-4 py-2 text-xs font-medium text-paper shadow-lg">
            {geo.error}
          </p>
        </div>
      )}

      {/* ── Bottom instrument panel ───────────────────────── */}
      <section className="animate-rise absolute inset-x-0 bottom-0 z-[1000] p-3">
        <div className="panel rounded-3xl px-5 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <Segmented<Mode>
              label="Modo de trazado"
              value={state.mode}
              onChange={planner.setMode}
              options={[
                { value: "auto", label: "Auto" },
                { value: "manual", label: "Manual" },
              ]}
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={planner.undo}
                disabled={!hasRoute}
                aria-label="Deshacer último punto"
                className="grid h-10 w-10 place-items-center rounded-full bg-pine/8 text-pine transition hover:bg-pine/15 active:scale-95 disabled:opacity-30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={planner.clear}
                disabled={!hasRoute}
                aria-label="Limpiar ruta"
                className="grid h-10 w-10 place-items-center rounded-full bg-pine/8 text-pine transition hover:bg-blaze hover:text-paper active:scale-95 disabled:opacity-30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-5xl font-medium leading-none tracking-tight text-pine">
                {dist.value}
              </span>
              <span className="text-lg font-semibold uppercase text-moss">
                {dist.unit}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1 pb-1">
              {route?.ascentMeters != null && route.ascentMeters > 0 && (
                <span className="font-mono text-sm font-medium text-pine-soft">
                  ↗ {Math.round(route.ascentMeters)} m
                </span>
              )}
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-moss">
                {state.waypoints.length}{" "}
                {state.waypoints.length === 1 ? "punto" : "puntos"}
              </span>
            </div>
          </div>

          <ElevationProfile route={route} />

          <div className="mt-2 h-4 text-[11px] font-medium">
            {loading && (
              <span className="text-moss">trazando ruta…</span>
            )}
            {!loading && route?.fallback && (
              <span className="text-blaze-deep">
                ruteo automático no disponible · línea recta
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
