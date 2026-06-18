"use client";

import BottomSheet, { type Snap } from "./BottomSheet";
import ProfilePicker from "./ProfilePicker";
import AlternativesBar from "./AlternativesBar";
import ElevationProfile from "./ElevationProfile";
import RouteMenu from "./RouteMenu";
import type { usePlanner } from "./usePlanner";
import type { RoutePoint } from "@/lib/types";
import type { ReactNode } from "react";

type Planner = ReturnType<typeof usePlanner>;

function fmtDist(m: number): { value: string; unit: string } {
  if (m < 1000) return { value: Math.round(m).toString(), unit: "m" };
  return { value: (m / 1000).toFixed(m < 10000 ? 2 : 1), unit: "km" };
}
function fmtTime(s: number): string {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: "auto" | "manual";
  onChange: (m: "auto" | "manual") => void;
}) {
  return (
    <div role="radiogroup" aria-label="Modo de trazado" className="flex rounded-full bg-pine/8 p-0.5">
      {(["auto", "manual"] as const).map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              active ? "bg-blaze text-paper shadow-sm" : "text-pine-soft hover:text-pine"
            }`}
          >
            {m === "auto" ? "Auto" : "Manual"}
          </button>
        );
      })}
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full bg-pine/8 text-pine transition hover:bg-pine/15 active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export default function RouteSheet({
  snap,
  onSnapChange,
  planner,
  stopsList,
  onHoverElevation,
  onSave,
  onOpenSaved,
  onExportGpx,
  onExportKml,
  onOpenGoogleMaps,
  onImportText,
  onOpenTools,
  onStartFromLocation,
}: {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  planner: Planner;
  stopsList?: ReactNode;
  onHoverElevation: (p: RoutePoint | null) => void;
  onSave: () => void;
  onOpenSaved: () => void;
  onExportGpx: () => void;
  onExportKml: () => void;
  onOpenGoogleMaps: () => void;
  onImportText: (text: string) => void;
  onOpenTools: () => void;
  onStartFromLocation: () => void;
}) {
  const { state, route, loading } = planner;
  const hasRoute = state.waypoints.length > 0;
  const canSave = state.waypoints.length >= 2;
  const dist = fmtDist(route?.distanceMeters ?? 0);

  const summary = (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col">
        {hasRoute ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-medium leading-none tracking-tight text-pine">
                {dist.value}
              </span>
              <span className="text-base font-semibold uppercase text-moss">{dist.unit}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-moss">
              {route?.timeSeconds != null && <span>~{fmtTime(route.timeSeconds)}</span>}
              {route?.ascentMeters != null && route.ascentMeters > 0 && (
                <span>↗ {Math.round(route.ascentMeters)} m</span>
              )}
              {route?.surface?.pavedRatio != null && (
                <span>· {Math.round(route.surface.pavedRatio * 100)}% asfalto</span>
              )}
              {loading && <span className="text-moss/70">· calculando…</span>}
            </div>
          </>
        ) : (
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-pine">Nueva ruta</p>
            <p className="mt-0.5 text-xs text-moss">Tocá el mapa o partí de tu ubicación.</p>
          </div>
        )}
      </div>
      <ProfilePicker value={state.profile} onChange={planner.setProfile} />
    </div>
  );

  return (
    <BottomSheet snap={snap} onSnapChange={onSnapChange} header={summary}>
      {!hasRoute && (
        <button
          onClick={onStartFromLocation}
          className="mt-1 flex w-full items-center gap-2 rounded-2xl bg-blaze px-4 py-3 text-sm font-semibold text-paper transition active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="3.2" fill="currentColor" />
            <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Partir de mi ubicación
        </button>
      )}

      {route && route.fallback && (
        <p className="mt-2 text-[11px] font-medium text-blaze-deep">
          Ruteo automático no disponible · línea recta
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <ModeToggle mode={state.mode} onChange={planner.setMode} />
        <div className="flex items-center gap-1.5">
          <IconButton onClick={planner.undo} disabled={!hasRoute} label="Deshacer">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
          <IconButton onClick={planner.clear} disabled={!hasRoute} label="Limpiar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </IconButton>
          <RouteMenu
            canExport={canSave}
            onSave={onSave}
            onOpenSaved={onOpenSaved}
            onReverse={planner.reverse}
            onExportGpx={onExportGpx}
            onExportKml={onExportKml}
            onOpenGoogleMaps={onOpenGoogleMaps}
            onImportText={onImportText}
          />
        </div>
      </div>

      <AlternativesBar
        alternatives={planner.alternatives}
        selected={planner.selected}
        onSelect={planner.setSelected}
      />

      {stopsList}

      <ElevationProfile route={route} onHover={onHoverElevation} />

      <button
        onClick={onOpenTools}
        className="mt-4 flex w-full items-center justify-between rounded-2xl bg-pine/5 px-4 py-3 text-sm font-semibold text-pine transition hover:bg-pine/10"
      >
        <span className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M14 6a3 3 0 10-1.8 2.75L9 12l-3-1-2 2 5 5 2-2-1-3 3.25-3.2A3 3 0 1014 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Herramientas
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-moss">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </BottomSheet>
  );
}
