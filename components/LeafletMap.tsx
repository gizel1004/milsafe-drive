"use client";

import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import { RISK_COLOR, ROAD_LABEL, type TaasZone, type Zone } from "@/lib/types";

export const TAAS_COLOR = { all: "#8e24aa", freezing: "#1e88e5" } as const;

function FlyTo({ zone, taas }: { zone: Zone | undefined; taas: TaasZone | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (zone) map.flyTo([zone.lat, zone.lng], Math.max(map.getZoom(), 9), { duration: 0.8 });
  }, [zone, map]);
  useEffect(() => {
    if (taas) map.flyTo([taas.lat, taas.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [taas, map]);
  return null;
}

/** 새 TAAS 조회 결과가 들어오면 전체가 보이도록 이동 */
function FitTaas({ zones }: { zones: TaasZone[] }) {
  const map = useMap();
  useEffect(() => {
    if (zones.length === 0) return;
    const bounds = L.latLngBounds(zones.map((z) => [z.lat, z.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [zones, map]);
  return null;
}

export default function LeafletMap({
  zones,
  selectedId,
  onSelect,
  taasZones,
  selectedTaasId,
  onSelectTaas,
}: {
  zones: Zone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  taasZones: TaasZone[];
  selectedTaasId: string | null;
  onSelectTaas: (id: string) => void;
}) {
  const selected = zones.find((z) => z.id === selectedId);
  const selectedTaas = taasZones.find((z) => z.id === selectedTaasId);
  return (
    <MapContainer center={[36.4, 127.9]} zoom={7} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo zone={selected} taas={selectedTaas} />
      <FitTaas zones={taasZones} />

      {zones.map((z) => {
        const isSel = z.id === selectedId;
        return (
          <CircleMarker
            key={z.id}
            center={[z.lat, z.lng]}
            radius={isSel ? 16 : 10 + z.risk}
            pathOptions={{
              color: isSel ? "#111" : "#fff",
              weight: isSel ? 3 : 2,
              fillColor: RISK_COLOR[z.risk],
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(z.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <b>{z.name}</b>
              <br />
              {ROAD_LABEL[z.road_type]} · 위험도 {z.risk} (교육용 예시)
            </Tooltip>
          </CircleMarker>
        );
      })}

      {taasZones.map((z) => {
        const isSel = z.id === selectedTaasId;
        const color = TAAS_COLOR[z.kind];
        return (
          <span key={z.id}>
            {z.geometry && (
              <GeoJSON
                key={`${z.id}-${isSel}`}
                data={{ type: "Feature", properties: {}, geometry: z.geometry } as unknown as GeoJsonObject}
                style={{ color, weight: isSel ? 3 : 2, fillColor: color, fillOpacity: 0.25 }}
                eventHandlers={{ click: () => onSelectTaas(z.id) }}
              />
            )}
            <CircleMarker
              center={[z.lat, z.lng]}
              radius={isSel ? 11 : 8}
              pathOptions={{ color: isSel ? "#111" : "#fff", weight: isSel ? 3 : 2, fillColor: color, fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelectTaas(z.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <b>{z.name}</b>
                <br />
                {z.year}년 사고 {z.occurrences}건 · 사망 {z.deaths}명
              </Tooltip>
            </CircleMarker>
          </span>
        );
      })}
    </MapContainer>
  );
}
