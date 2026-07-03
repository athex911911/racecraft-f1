"use client";

import "leaflet/dist/leaflet.css";

import { useRouter } from "next/navigation";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

import type { CircuitListItem } from "@/types/f1";

/**
 * Dark interactive world map of every circuit. Drawn CircleMarkers (no image
 * assets, so nothing 404s under the bundler); on-calendar tracks glow red,
 * clicking a circuit opens its detail page.
 */
export function WorldMap({ circuits }: { circuits: CircuitListItem[] }) {
  const router = useRouter();
  const pins = circuits.filter((c) => c.circuit.lat != null && c.circuit.lng != null);

  return (
    <MapContainer
      center={[25, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={7}
      scrollWheelZoom={false}
      worldCopyJump
      style={{ height: "100%", width: "100%", background: "#070707" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {pins.map((item) => {
        const c = item.circuit;
        const current = item.on_current_calendar;
        return (
          <CircleMarker
            key={c.id}
            center={[c.lat as number, c.lng as number]}
            radius={current ? 6 : 4}
            pathOptions={{
              color: current ? "#E10600" : "#8a8a8a",
              fillColor: current ? "#E10600" : "#3d3d3d",
              fillOpacity: current ? 0.9 : 0.6,
              weight: current ? 2 : 1,
            }}
            eventHandlers={{ click: () => router.push(`/circuits/${c.circuit_ref}`) }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              <div className="text-xs">
                <p className="font-semibold">{c.name}</p>
                <p className="text-neutral-500">
                  {[c.location, c.country].filter(Boolean).join(", ")}
                </p>
                {item.last_winner && <p className="text-neutral-500">Last win: {item.last_winner}</p>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
