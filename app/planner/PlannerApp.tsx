"use client";

import { useEffect, useState } from "react";
import { usePlanner } from "./usePlanner";
import { useGeolocation } from "./useGeolocation";
import { useSavedRoutes } from "./useSavedRoutes";
import { useRecorder } from "./useRecorder";
import MapView, { type Ring } from "./MapView";
import SearchBox from "./SearchBox";
import LayerSwitcher from "./LayerSwitcher";
import { useLayer } from "./useLayer";
import { usePois } from "./usePois";
import { useOnline } from "./useOnline";
import OfflinePanel from "./OfflinePanel";
import RoutesSheet from "./RoutesSheet";
import RouteSheet from "./RouteSheet";
import ToolsSheet from "./ToolsSheet";
import RecorderStatusBar from "./RecorderStatusBar";
import PwaRegister from "./PwaRegister";
import type { Snap } from "./BottomSheet";
import { downloadText } from "./download";
import { loadLastLocation } from "./lastLocation";
import { nearestSegmentIndex } from "@/lib/geo/segment";
import { totalDistance } from "@/lib/geo/haversine";
import { toGpx, fromGpx } from "@/lib/io/gpx";
import { toKml } from "@/lib/io/kml";
import { directionsUrl } from "@/lib/io/googleMaps";
import type { SavedRoute } from "@/lib/store/routeStore";
import type { BBox, LatLng } from "@/lib/types";

const CENTER = { lat: 40.4168, lng: -3.7038 }; // Madrid

export default function PlannerApp() {
  const planner = usePlanner();
  const geo = useGeolocation();
  const saved = useSavedRoutes();
  const recorder = useRecorder();
  const layer = useLayer();
  const online = useOnline();
  const [view, setView] = useState<{ bbox: BBox; zoom: number } | null>(null);
  const pois = usePois(view?.bbox ?? null);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<LatLng | null>(null);
  const [routesOpen, setRoutesOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [snap, setSnap] = useState<Snap>("peek");
  const [rings, setRings] = useState<Ring[]>([]);
  const [lastRing, setLastRing] = useState<Ring | null>(null);
  const [hoverPoint, setHoverPoint] = useState<LatLng | null>(null);
  const [tool, setTool] = useState<"plan" | "measure">("plan");
  const [measurePoints, setMeasurePoints] = useState<LatLng[]>([]);
  const [initialCenter] = useState<LatLng>(() => loadLastLocation() ?? CENTER);
  const { state, route } = planner;

  const canSave = state.waypoints.length >= 2;

  // Locate on open so the map starts at the user's position, not Madrid.
  const locate = geo.locate;
  useEffect(() => {
    locate();
  }, [locate]);

  function handleSave() {
    if (!route || !canSave) return;
    const name = window.prompt("Nombre de la ruta:");
    if (name && name.trim()) saved.save(route, name.trim());
  }

  function handleLoad(r: SavedRoute) {
    planner.load(r.waypoints, r.mode, r.profile);
    setSearchTarget(r.waypoints[0] ?? null);
    setRoutesOpen(false);
    setSnap("peek");
  }

  function handleExportGpx() {
    if (route) downloadText("naturoutes-ruta.gpx", "application/gpx+xml", toGpx(route));
  }
  function handleExportKml() {
    if (route)
      downloadText("naturoutes-ruta.kml", "application/vnd.google-earth.kml+xml", toKml(route));
  }
  function handleGoogleMaps() {
    if (!route) return;
    const url = directionsUrl(route, state.profile);
    if (url) window.open(url, "_blank", "noopener");
  }

  function handleAddRing(radiusKm: number) {
    if (!geo.position) return;
    const ring: Ring = {
      id: crypto.randomUUID(),
      center: { lat: geo.position.lat, lng: geo.position.lng },
      radiusKm,
    };
    setRings((rs) => [...rs, ring]);
    setLastRing(ring);
  }

  function handleMapClick(point: LatLng) {
    if (tool === "measure") setMeasurePoints((ms) => [...ms, point]);
    else planner.addWaypoint(point);
  }

  function toggleMeasure() {
    setTool((t) => (t === "measure" ? "plan" : "measure"));
    setMeasurePoints([]);
    setToolsOpen(false); // close the sheet so the map is tappable
  }

  function handleInsertWaypoint(point: LatLng) {
    if (state.waypoints.length < 2) {
      planner.addWaypoint(point);
      return;
    }
    const i = nearestSegmentIndex(state.waypoints, point);
    planner.insertWaypoint(i + 1, point);
  }

  function handleImport(text: string) {
    const { waypoints, dense } = fromGpx(text);
    if (waypoints.length < 2) {
      window.alert("GPX inválido o sin puntos suficientes.");
      return;
    }
    planner.load(waypoints, dense ? "manual" : state.mode, state.profile);
    setSearchTarget(waypoints[0]);
  }

  function handleStartFromLocation() {
    if (geo.position) {
      planner.addWaypoint(geo.position);
      setSnap("peek");
    } else {
      geo.locate();
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-paper-deep">
      <PwaRegister />
      <div className="absolute inset-0">
        <MapView
          route={route}
          waypoints={state.waypoints}
          userPosition={geo.position}
          recenter={geo.centerTarget}
          rings={rings}
          fitRing={lastRing}
          hoverPoint={hoverPoint}
          measurePoints={measurePoints}
          baseLayer={layer.layer}
          pois={pois.pois}
          onMapClick={handleMapClick}
          onMoveWaypoint={planner.moveWaypoint}
          onInsertWaypoint={handleInsertWaypoint}
          onDeleteWaypoint={planner.removeWaypoint}
          onBoundsChange={(b, z) => setView({ bbox: b, zoom: z })}
          center={initialCenter}
          zoom={13}
          flyTo={searchTarget}
        />
      </div>

      {/* ── Top bar: wordmark · search · layers ───────────── */}
      <header className="animate-drop pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-center gap-2 p-3">
        <SearchBox
          origin={geo.position ?? CENTER}
          onActivate={geo.locate}
          onSelect={(p) => setSearchTarget({ lat: p.lat, lng: p.lng })}
        />
        <div className="ml-auto flex items-center gap-2">
          <LayerSwitcher
            value={layer.id}
            onChange={layer.setId}
            poisEnabled={pois.enabled}
            onTogglePois={pois.toggle}
            onOpenOffline={() => setOfflineOpen(true)}
          />
        </div>
      </header>

      <RecorderStatusBar recorder={recorder} />

      {/* Measure indicator (visible while the sheets are closed) */}
      {tool === "measure" && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
          <div className="panel flex items-center gap-3 rounded-full px-4 py-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-moss">Medir</span>
            <span className="font-mono text-sm font-semibold text-pine">
              {measurePoints.length < 2 ? "tocá el mapa" : `${(totalDistance(measurePoints) / 1000).toFixed(2)} km`}
            </span>
            <button onClick={toggleMeasure} aria-label="Terminar medición" className="text-moss">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* GPS button (floats just above the collapsed sheet) */}
      <button
        onClick={geo.locate}
        aria-label="Centrar en mi ubicación"
        className="panel absolute bottom-36 right-3 z-[1000] grid h-12 w-12 place-items-center rounded-full text-pine transition active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3.2" fill="var(--blaze)" />
          <circle cx="12" cy="12" r="7" stroke="var(--pine)" strokeWidth="1.6" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="var(--pine)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {geo.error && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[1100] flex justify-center px-6">
          <span className="rounded-full bg-pine px-4 py-2 text-xs font-medium text-paper shadow-lg">
            {geo.error}
          </span>
        </div>
      )}

      {!online && (
        <div className="pointer-events-none absolute inset-x-0 top-32 z-[1100] flex justify-center">
          <span className="rounded-full bg-pine px-3 py-1 text-xs font-medium text-paper shadow-lg">
            Sin conexión · mapa offline
          </span>
        </div>
      )}

      {/* ── Main route sheet ──────────────────────────────── */}
      <RouteSheet
        snap={snap}
        onSnapChange={setSnap}
        planner={planner}
        onHoverElevation={setHoverPoint}
        onSave={handleSave}
        onOpenSaved={() => setRoutesOpen(true)}
        onExportGpx={handleExportGpx}
        onExportKml={handleExportKml}
        onOpenGoogleMaps={handleGoogleMaps}
        onImportText={handleImport}
        onOpenTools={() => setToolsOpen(true)}
        onStartFromLocation={handleStartFromLocation}
      />

      <ToolsSheet
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        recorder={recorder}
        profile={state.profile}
        onSaveRoute={(r, name) => saved.save(r, name, "recorded")}
        measureActive={tool === "measure"}
        measureDistance={totalDistance(measurePoints)}
        measurePointsCount={measurePoints.length}
        onToggleMeasure={toggleMeasure}
        onClearMeasure={() => setMeasurePoints([])}
        rings={rings}
        canAddRing={!!geo.position}
        onAddRing={handleAddRing}
        onRemoveRing={(id) => setRings((rs) => rs.filter((r) => r.id !== id))}
        onClearRings={() => setRings([])}
        onRequestLocate={geo.locate}
      />

      <RoutesSheet
        open={routesOpen}
        routes={saved.routes}
        onClose={() => setRoutesOpen(false)}
        onLoad={handleLoad}
        onDelete={saved.remove}
      />

      <OfflinePanel
        open={offlineOpen}
        onClose={() => setOfflineOpen(false)}
        bbox={view?.bbox ?? null}
        baseZoom={view?.zoom ?? 13}
        baseLayer={layer.layer}
      />
    </div>
  );
}
