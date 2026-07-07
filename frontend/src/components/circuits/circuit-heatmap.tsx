"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { CIRCUIT_GEO } from "@/lib/design/circuit-tracks-geo";
import { cn } from "@/lib/utils";

/**
 * Performance heatmap on the real satellite view: the track ribbon is coloured
 * by a modelled speed / throttle / braking profile. Speed comes from a
 * quasi-physical solver over the real centre-line geometry (corner speed from
 * curvature, then forward accel + backward braking limits), so braking zones
 * appear before corners and the traps light up on the straights.
 *
 * Same honest caveat as the racing lines: this is a geometry model, not
 * telemetry — but it reads like a real speed trace laid on the tarmac.
 */

type LL = [number, number];

const MODES = [
  { key: "speed", label: "Speed", note: "corner & straight-line speed" },
  { key: "throttle", label: "Throttle", note: "where the car is on power" },
  { key: "braking", label: "Braking", note: "heavy braking zones" },
] as const;
type ModeKey = (typeof MODES)[number]["key"];

// F1-ballpark limits for the solver
const V_MAX = 94; // m/s ≈ 338 km/h
const A_LAT = 44; // m/s² lateral (~4.5 g)
const A_ACC = 13; // m/s² longitudinal accel
const A_BRK = 48; // m/s² braking (~4.9 g)

type Profile = { v: number[]; acc: number[]; vMin: number; vMax: number };

/** Solve a speed profile over the closed centre-line. Returns m/s + long. accel. */
function deriveProfile(track: LL[]): Profile {
  const n = track.length;
  const lat0 = track.reduce((s, p) => s + p[0], 0) / n;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  const P = track.map(([la, ln]) => [ln * kx, la * ky] as LL); // metres
  const at = (i: number) => P[((i % n) + n) % n];

  const ds = P.map((_, i) => {
    const a = at(i);
    const b = at(i + 1);
    return Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 1e-3);
  });

  // Menger curvature (1/R) at each node, lightly smoothed
  const rawK = P.map((_, i) => {
    const a = at(i - 1);
    const b = at(i);
    const c = at(i + 1);
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
    const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
    const denom = ab * bc * ca;
    return denom > 1e-6 ? (4 * area) / denom : 0;
  });
  const k = rawK.map((_, i) => (rawK[(i - 1 + n) % n] + rawK[i] + rawK[(i + 1) % n]) / 3);

  // corner-limited speed
  const v = k.map((kk) => (kk > 1e-6 ? Math.min(V_MAX, Math.sqrt(A_LAT / kk)) : V_MAX));

  // forward (accel) + backward (braking) passes; repeat to converge the loop
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      const p = (i - 1 + n) % n;
      v[i] = Math.min(v[i], Math.sqrt(v[p] * v[p] + 2 * A_ACC * ds[p]));
    }
    for (let i = n - 1; i >= 0; i--) {
      const nx = (i + 1) % n;
      v[i] = Math.min(v[i], Math.sqrt(v[nx] * v[nx] + 2 * A_BRK * ds[i]));
    }
  }

  const acc = v.map((_, i) => {
    const nx = (i + 1) % n;
    return (v[nx] * v[nx] - v[i] * v[i]) / (2 * ds[i]);
  });

  return { v, acc, vMin: Math.min(...v), vMax: Math.max(...v) };
}

/** Colour for a node under the active mode. */
function nodeColor(mode: ModeKey, prof: Profile, i: number): string {
  if (mode === "speed") {
    const t = (prof.v[i] - prof.vMin) / Math.max(prof.vMax - prof.vMin, 1e-3);
    return `hsl(${Math.round(t * 185)}, 88%, 52%)`; // red slow → cyan fast
  }
  if (mode === "throttle") {
    const onPower = prof.v[i] >= V_MAX * 0.985 ? 1 : Math.max(0, Math.min(1, prof.acc[i] / A_ACC));
    if (onPower < 0.05) return "hsl(0,0%,32%)"; // coasting / braking → grey
    return `hsl(145, 82%, ${22 + onPower * 34}%)`;
  }
  // braking
  const brake = Math.max(0, Math.min(1, -prof.acc[i] / A_BRK));
  if (brake < 0.05) return "hsl(0,0%,30%)";
  return `hsl(6, 90%, ${28 + brake * 30}%)`;
}

function labelIcon(text: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;gap:5px;padding:2px 8px 2px 3px;border-radius:9999px;background:rgba(13,13,13,0.88);border:1px solid rgba(255,255,255,0.45);box-shadow:0 1px 5px rgba(0,0,0,0.75);white-space:nowrap"><span style="width:9px;height:9px;border-radius:9999px;background:${color}"></span><span style="color:#f5f5f5;font:700 10px/1 var(--font-barlow,sans-serif);letter-spacing:0.02em">${text}</span></div>`,
    iconSize: [Math.round(30 + text.length * 6), 20],
    iconAnchor: [12, 10],
  });
}

function MapReady({ track }: { track?: LL[] }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (!track) return;
      const bounds = L.latLngBounds(track);
      map.fitBounds(bounds, { padding: [24, 24] });
      map.setMinZoom(map.getZoom());
      map.setMaxBounds(bounds.pad(0.35));
    }, 80);
    return () => clearTimeout(t);
  }, [map, track]);
  return null;
}

export function CircuitHeatmap({
  circuitRef,
  lat,
  lng,
}: {
  circuitRef: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const [mode, setMode] = useState<ModeKey>("speed");
  const track = CIRCUIT_GEO[circuitRef] as LL[] | undefined;
  const prof = useMemo(() => (track ? deriveProfile(track) : null), [track]);
  const center: LL = track ? track[0] : [lat ?? 0, lng ?? 0];

  // coloured segments for the active mode
  const segments = useMemo(() => {
    if (!track || !prof) return [];
    const n = track.length;
    return track.map((p, i) => ({
      positions: [p, track[(i + 1) % n]] as LL[],
      color: nodeColor(mode, prof, i),
    }));
  }, [track, prof, mode]);

  // slowest-corner + top-speed markers (speed mode only)
  const markers = useMemo(() => {
    if (!track || !prof || mode !== "speed") return [];
    let iMin = 0;
    let iMax = 0;
    prof.v.forEach((v, i) => {
      if (v < prof.v[iMin]) iMin = i;
      if (v > prof.v[iMax]) iMax = i;
    });
    const kmh = (v: number) => `${Math.round(v * 3.6)} km/h`;
    return [
      { pos: track[iMin], text: kmh(prof.v[iMin]), color: "hsl(0,88%,52%)" },
      { pos: track[iMax], text: kmh(prof.v[iMax]), color: "hsl(185,88%,52%)" },
    ];
  }, [track, prof, mode]);

  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="relative overflow-hidden rounded-card rounded-tr-none border border-white/8">
      <div className="h-[460px] w-full sm:h-[580px]">
        <MapContainer
          className="circuit-sat"
          center={center}
          zoom={15}
          minZoom={12}
          maxZoom={18}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          maxBoundsViscosity={1}
          style={{ height: "100%", width: "100%", background: "#0d0d0d" }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
            maxNativeZoom={18}
          />
          <MapReady track={track} />

          {track ? (
            <>
              {/* dark casing so the colour ribbon reads on the imagery */}
              <Polyline
                positions={[...track, track[0]]}
                pathOptions={{ color: "#000", weight: 10, opacity: 0.5 }}
              />
              {segments.map((s, i) => (
                <Polyline
                  key={i}
                  positions={s.positions}
                  pathOptions={{ color: s.color, weight: 6, opacity: 0.95, lineCap: "butt" }}
                />
              ))}
              {markers.map((m, i) => (
                <Marker key={i} position={m.pos} icon={labelIcon(m.text, m.color)} interactive={false} />
              ))}
            </>
          ) : null}
        </MapContainer>
      </div>

      {/* mode selector */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-lg rounded-tr-none border px-3 py-2 text-left backdrop-blur transition",
                on ? "border-white/25 bg-black/70" : "border-white/10 bg-black/45 hover:bg-black/60",
              )}
            >
              <span
                className={cn(
                  "font-display text-xs font-bold uppercase tracking-wide",
                  on ? "text-white" : "text-silver",
                )}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* legend + caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900] bg-gradient-to-t from-black/75 to-transparent px-4 pb-2.5 pt-9">
        <div className="flex items-center gap-2">
          {mode === "speed" ? (
            <>
              <span className="text-[10px] text-silver">Slow</span>
              <span
                className="h-2 w-28 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(0,88%,52%), hsl(60,88%,52%), hsl(120,88%,52%), hsl(185,88%,52%))",
                }}
              />
              <span className="text-[10px] text-silver">Fast</span>
            </>
          ) : mode === "throttle" ? (
            <>
              <span className="text-[10px] text-silver">Off</span>
              <span
                className="h-2 w-28 rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(0,0%,32%), hsl(145,82%,56%))" }}
              />
              <span className="text-[10px] text-silver">Full throttle</span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-silver">Coasting</span>
              <span
                className="h-2 w-28 rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(0,0%,30%), hsl(6,90%,58%))" }}
              />
              <span className="text-[10px] text-silver">Heavy braking</span>
            </>
          )}
        </div>
        <p className="mt-1 text-[10px] text-silver">
          {track ? `${activeMode.label} · ${activeMode.note}` : "Overlay unavailable for this circuit"}
          <span className="ml-1 text-muted">· modelled from track geometry, not telemetry</span>
        </p>
      </div>
    </div>
  );
}
