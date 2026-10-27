"use client";

import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RISK_COLOR } from "@/lib/types";

type Pt = { id: string; name: string; lat: number; lng: number; risk: number };

function Fit({ pts, focus }: { pts: Pt[]; focus: string | null }) {
  const map = useMap();
  useEffect(() => {
    const f = pts.find((p) => p.id === focus);
    if (f) map.flyTo([f.lat, f.lng], 13, { duration: 0.6 });
    else if (pts.length) map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 12 });
  }, [pts, focus, map]);
  return null;
}

export default function AdminMap({ pts, focus, onSelect }: { pts: Pt[]; focus: string | null; onSelect: (id: string) => void }) {
  return (
    <MapContainer center={[36.3, 127.8]} zoom={7} minZoom={6} maxBounds={L.latLngBounds([32.8, 124], [43.2, 132]).pad(0.05)} style={{ width: "100%", height: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit pts={pts} focus={focus} />
      {pts.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={p.id === focus ? 14 : 10}
          pathOptions={{ color: "#111", weight: p.id === focus ? 3 : 2, dashArray: "4 3", fillColor: RISK_COLOR[p.risk] ?? "#fbc02d", fillOpacity: 0.9 }}
          eventHandlers={{ click: () => onSelect(p.id) }}
        >
          <Tooltip direction="top">{p.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
