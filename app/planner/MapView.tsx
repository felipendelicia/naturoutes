"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLng, Route } from "@/lib/types";

export type Ring = { id: string; center: LatLng; radiusKm: number };

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

// Trackpad gestures: two-finger swipe pans, pinch (ctrl+wheel) zooms.
function TrackpadGestures() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        // Trackpad pinch / ctrl+wheel → zoom around the cursor.
        const zoom = map.getZoom() - e.deltaY * 0.01;
        map.setZoomAround(map.mouseEventToContainerPoint(e), zoom, {
          animate: false,
        });
      } else {
        // Two-finger swipe → pan.
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
  onMapClick,
  center,
  zoom,
  flyTo = null,
}: {
  route: Route | null;
  waypoints: LatLng[];
  userPosition: (LatLng & { accuracy?: number }) | null;
  recenter?: LatLng | null;
  rings?: Ring[];
  onMapClick: (p: LatLng) => void;
  center: LatLng;
  zoom: number;
  flyTo?: LatLng | null;
}) {
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onMapClick={onMapClick} />
      <RecenterOnUser position={recenter} />
      <FlyTo target={flyTo} />
      <TrackpadGestures />

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
        />
      )}

      {waypoints.map((w, i) => (
        <CircleMarker
          key={i}
          center={[w.lat, w.lng]}
          radius={6}
          pathOptions={{
            color: "#f3efe4",
            weight: 2,
            fillColor: "#16271d",
            fillOpacity: 1,
          }}
        />
      ))}

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
