"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng, BBox, Route } from "@/lib/types";
import { layerById, type BaseLayer } from "@/lib/map/layers";
import type { Poi, PoiKind } from "@/lib/poi/overpass";

const POI_STYLE: Record<PoiKind | "other", { color: string; label: string }> = {
  water: { color: "#0e7490", label: "Agua" },
  shelter: { color: "#7c5e10", label: "Refugio" },
  bicycle_parking: { color: "#3f6212", label: "Estacionamiento bici" },
  bicycle_shop: { color: "#9d174d", label: "Bicicletería" },
  other: { color: "#2f4338", label: "POI" },
};

export type Ring = { id: string; center: LatLng; radiusKm: number };

const waypointIcon = L.divIcon({
  className: "naturoutes-wp",
  html:
    '<span style="display:block;width:15px;height:15px;border-radius:50%;' +
    'background:#16271d;border:2px solid #f3efe4;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>',
  iconSize: [15, 15],
  iconAnchor: [7.5, 7.5],
});

function BoundsEmitter({
  onChange,
}: {
  onChange?: (b: BBox, zoom: number) => void;
}) {
  const map = useMap();
  const emit = () => {
    if (!onChange) return;
    const b = map.getBounds();
    onChange(
      {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      },
      map.getZoom(),
    );
  };
  useMapEvents({ moveend: emit, zoomend: emit });
  useEffect(() => {
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

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

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 14);
  }, [target, map]);
  return null;
}

// When a radius ring is added, fit the map so the whole circle is visible.
function FitRing({ ring }: { ring: Ring | null }) {
  const map = useMap();
  useEffect(() => {
    if (!ring) return;
    const bounds = L.latLng(ring.center.lat, ring.center.lng).toBounds(
      ring.radiusKm * 2000,
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [ring, map]);
  return null;
}

// Pointer gestures:
//  - mouse wheel        → zoom
//  - pinch / ctrl+wheel → zoom
//  - trackpad two-finger swipe → pan
// A mouse wheel reports line/page deltas (deltaMode !== 0) or large vertical-only
// pixel deltas; a trackpad swipe reports small pixel deltas, usually with deltaX.
function TrackpadGestures() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const isMouseWheel =
        e.deltaMode !== 0 ||
        (e.deltaX === 0 && Math.abs(e.deltaY) >= 50);
      if (e.ctrlKey || isMouseWheel) {
        // Normalize line/page deltas to pixels so a notch zooms a sensible amount.
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
        const dy = e.deltaY * unit;
        const zoom = map.getZoom() - dy * 0.01;
        map.setZoomAround(map.mouseEventToContainerPoint(e), zoom, {
          animate: false,
        });
      } else {
        map.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [map]);
  return null;
}

export default function MapView({
  route,
  waypoints,
  userPosition,
  recenter = null,
  rings = [],
  fitRing = null,
  hoverPoint = null,
  measurePoints = [],
  baseLayer = layerById("osm"),
  pois = [],
  onMapClick,
  onMoveWaypoint,
  onInsertWaypoint,
  onDeleteWaypoint,
  onBoundsChange,
  center,
  zoom,
  flyTo = null,
}: {
  route: Route | null;
  waypoints: LatLng[];
  userPosition: (LatLng & { accuracy?: number }) | null;
  recenter?: LatLng | null;
  rings?: Ring[];
  fitRing?: Ring | null;
  hoverPoint?: LatLng | null;
  measurePoints?: LatLng[];
  baseLayer?: BaseLayer;
  pois?: Poi[];
  onMapClick: (p: LatLng) => void;
  onMoveWaypoint?: (index: number, point: LatLng) => void;
  onInsertWaypoint?: (point: LatLng) => void;
  onDeleteWaypoint?: (index: number) => void;
  onBoundsChange?: (b: BBox, zoom: number) => void;
  center: LatLng;
  zoom: number;
  flyTo?: LatLng | null;
}) {
  // A click on the route line inserts a point; suppress the map click that follows.
  const skipMapClick = useRef(false);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={false}
      scrollWheelZoom={false}
      zoomSnap={0}
    >
      <TileLayer
        key={baseLayer.id}
        attribution={baseLayer.attribution}
        url={baseLayer.url}
        maxZoom={baseLayer.maxZoom}
        {...(baseLayer.subdomains ? { subdomains: baseLayer.subdomains } : {})}
      />
      <ClickHandler
        onMapClick={(p) => {
          if (skipMapClick.current) {
            skipMapClick.current = false;
            return;
          }
          onMapClick(p);
        }}
      />
      <RecenterOnUser position={recenter} />
      <FlyTo target={flyTo} />
      <FitRing ring={fitRing} />
      <TrackpadGestures />
      <BoundsEmitter onChange={onBoundsChange} />

      {pois.map((p) => {
        const style = POI_STYLE[p.kind];
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={5}
            pathOptions={{
              color: "#f3efe4",
              weight: 1.5,
              fillColor: style.color,
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>{style.label}</strong>
              {p.name ? ` · ${p.name}` : ""}
            </Popup>
          </CircleMarker>
        );
      })}

      {rings.map((r) => (
        <Circle
          key={r.id}
          center={[r.center.lat, r.center.lng]}
          radius={r.radiusKm * 1000}
          pathOptions={{
            color: "#2f4338",
            weight: 1.5,
            dashArray: "4 7",
            fill: false,
          }}
        />
      ))}

      {route && route.geometry.length >= 2 && (
        <Polyline
          positions={route.geometry.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: route.fallback ? "#c44d1d" : "#e6612b",
            weight: 5,
            opacity: 0.95,
            dashArray: route.fallback ? "2 8" : undefined,
            lineCap: "round",
            lineJoin: "round",
          }}
          eventHandlers={
            onInsertWaypoint
              ? {
                  click: (e) => {
                    skipMapClick.current = true;
                    onInsertWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
                  },
                }
              : undefined
          }
        />
      )}

      {waypoints.map((w, i) => (
        <Marker
          key={i}
          position={[w.lat, w.lng]}
          icon={waypointIcon}
          draggable={!!onMoveWaypoint}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onMoveWaypoint?.(i, { lat: ll.lat, lng: ll.lng });
            },
            contextmenu: () => onDeleteWaypoint?.(i),
          }}
        />
      ))}

      {measurePoints.length >= 2 && (
        <Polyline
          positions={measurePoints.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "#2f4338", weight: 2, dashArray: "5 5" }}
        />
      )}
      {measurePoints.map((p, i) => (
        <CircleMarker
          key={`m${i}`}
          center={[p.lat, p.lng]}
          radius={4}
          pathOptions={{
            color: "#f3efe4",
            weight: 1.5,
            fillColor: "#2f4338",
            fillOpacity: 1,
          }}
        />
      ))}

      {hoverPoint && (
        <CircleMarker
          center={[hoverPoint.lat, hoverPoint.lng]}
          radius={7}
          pathOptions={{
            color: "#f3efe4",
            weight: 3,
            fillColor: "#e6612b",
            fillOpacity: 1,
          }}
        />
      )}

      {userPosition?.accuracy != null && userPosition.accuracy > 0 && (
        <Circle
          center={[userPosition.lat, userPosition.lng]}
          radius={userPosition.accuracy}
          pathOptions={{
            color: "#0e7490",
            weight: 1,
            fillColor: "#0e7490",
            fillOpacity: 0.12,
          }}
        />
      )}

      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={7}
          pathOptions={{
            color: "#f3efe4",
            weight: 3,
            fillColor: "#0e7490",
            fillOpacity: 1,
          }}
        />
      )}
    </MapContainer>
  );
}
