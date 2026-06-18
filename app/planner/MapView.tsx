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

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 14);
  }, [target, map]);
  return null;
}

export default function MapView({
  route,
  waypoints,
  userPosition,
  onMapClick,
  center,
  zoom,
  flyTo = null,
}: {
  route: Route | null;
  waypoints: LatLng[];
  userPosition: LatLng | null;
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
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onMapClick={onMapClick} />
      <RecenterOnUser position={userPosition} />
      <FlyTo target={flyTo} />

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
