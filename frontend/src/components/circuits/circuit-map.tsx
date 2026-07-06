"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

import { CIRCUIT_GEO } from "@/lib/design/circuit-tracks-geo";
import { cn } from "@/lib/utils";

/**
 * Real aerial view of the circuit (Esri World Imagery satellite tiles) with the
 * three racing lines drawn on top. Because the lines are computed in real
 * lat/lng they sit exactly on the tarmac. Zoom/pan is native Leaflet.
 *
 * The track shape is real (bacinger/f1-circuits); the lines are a geometry
 * model (inside-of-corner offset), not lap telemetry.
 */

type LL = [number, number];

const LINES = [
  { key: "fastest", label: "Fastest", color: "#FF1801", note: "latest apex, hardest cut", aggr: 1.0 },
  { key: "optimal", label: "Optimal", color: "#00E1FF", note: "balanced racing line", aggr: 0.6 },
  { key: "slowest", label: "Slowest", color: "#FFB800", note: "conservative, stays central", aggr: 0.28 },
] as const;
type LineKey = (typeof LINES)[number]["key"];

/** Derive the three racing lines from the real centre-line, in lat/lng. */
function deriveLines(track: LL[]): Record<LineKey, LL[]> {
  const lat0 = track.reduce((s, p) => s + p[0], 0) / track.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  const P = track.map(([la, ln]) => [ln * kx, la * ky] as LL); // metres (east, north)
  const n = P.length;
  const at = (i: number) => P[((i % n) + n) % n];
  const raw = P.map((_, i) => {
    const a = at(i - 1);
    const b = at(i);
    const c = at(i + 1);
    return [(a[0] + c[0]) / 2 - b[0], (a[1] + c[1]) / 2 - b[1]] as LL;
  });
  const W = Math.max(3, Math.round(n * 0.03));
  const sm = raw.map((_, i) => {
    let sx = 0;
    let sy = 0;
    for (let j = -W; j <= W; j++) {
      const r = raw[((i + j) % n + n) % n];
      sx += r[0];
      sy += r[1];
    }
    const c = 2 * W + 1;
    return [sx / c, sy / c] as LL;
  });
  let maxM = 1e-6;
  for (const s of sm) maxM = Math.max(maxM, Math.hypot(s[0], s[1]));
  const line = (aggr: number, maxAmp = 7) =>
    track.map((orig, i) => {
      const s = sm[i];
      const m = Math.hypot(s[0], s[1]);
      if (m < 1e-6) return orig;
      const amt = (m / maxM) * maxAmp * aggr; // metres
      return [orig[0] + (s[1] / m) * amt / ky, orig[1] + (s[0] / m) * amt / kx] as LL;
    });
  return { fastest: line(1.0), optimal: line(0.6), slowest: line(0.28) };
}

function MapReady({ track }: { track?: LL[] }) {
  const map = useMap();
  useEffect(() => {
    // the section animates in (whileInView), so settle the size before fitting
    const t = setTimeout(() => {
      map.invalidateSize();
      if (!track) return;
      const bounds = L.latLngBounds(track);
      map.fitBounds(bounds, { padding: [24, 24] });
      // lock the view to the circuit: no zooming out past the framed track,
      // no panning away from it
      map.setMinZoom(map.getZoom());
      map.setMaxBounds(bounds.pad(0.35));
    }, 80);
    return () => clearTimeout(t);
  }, [map, track]);
  return null;
}

/** A marker running the selected line, moved imperatively (no per-frame re-render). */
function RacingCar({ line, color }: { line: LL[]; color: string }) {
  const ref = useRef<L.CircleMarker>(null);
  useEffect(() => {
    const cum = [0];
    for (let i = 1; i < line.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    }
    const total = cum[cum.length - 1] || 1;
    const dur = 8000;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = (((now - t0) % dur) / dur) * total;
      let j = 1;
      while (j < cum.length && cum[j] < p) j++;
      if (j >= cum.length) j = cum.length - 1;
      const seg = (p - cum[j - 1]) / Math.max(cum[j] - cum[j - 1], 1e-9);
      const lat = line[j - 1][0] + seg * (line[j][0] - line[j - 1][0]);
      const lng = line[j - 1][1] + seg * (line[j][1] - line[j - 1][1]);
      ref.current?.setLatLng([lat, lng]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [line]);
  return (
    <CircleMarker
      ref={ref}
      center={line[0]}
      radius={6}
      pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }}
    />
  );
}

export function CircuitMap({
  circuitRef,
  lat,
  lng,
}: {
  circuitRef: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const [sel, setSel] = useState<LineKey>("optimal");
  const track = CIRCUIT_GEO[circuitRef] as LL[] | undefined;
  const lines = useMemo(() => (track ? deriveLines(track) : null), [track]);
  const selColor = LINES.find((l) => l.key === sel)!.color;
  const center: LL = track ? track[0] : [lat ?? 0, lng ?? 0];

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

          {lines
            ? LINES.filter((l) => l.key !== sel).map((l) => (
                <Polyline
                  key={l.key}
                  positions={lines[l.key]}
                  pathOptions={{ color: l.color, weight: 2.5, opacity: 0.5 }}
                />
              ))
            : null}
          {lines ? (
            <>
              <Polyline
                key={`${sel}-casing`}
                positions={lines[sel]}
                pathOptions={{ color: "#000", weight: 8, opacity: 0.45 }}
              />
              <Polyline
                key={`${sel}-line`}
                positions={lines[sel]}
                pathOptions={{ color: selColor, weight: 4.5, opacity: 1 }}
              />
              <RacingCar line={lines[sel]} color={selColor} />
            </>
          ) : null}
        </MapContainer>
      </div>

      {/* line selector, over the map */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
        {LINES.map((l) => {
          const active = sel === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setSel(l.key)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg rounded-tr-none border px-3 py-2 text-left backdrop-blur transition",
                active
                  ? "border-white/25 bg-black/70"
                  : "border-white/10 bg-black/45 hover:bg-black/60",
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: l.color, boxShadow: active ? `0 0 8px ${l.color}` : undefined }}
              />
              <span
                className={cn(
                  "font-display text-xs font-bold uppercase tracking-wide",
                  active ? "text-white" : "text-silver",
                )}
              >
                {l.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900] bg-gradient-to-t from-black/70 to-transparent px-4 pb-2.5 pt-8">
        <p className="text-[10px] text-silver">
          {track
            ? `${LINES.find((l) => l.key === sel)!.label} line · ${LINES.find((l) => l.key === sel)!.note}`
            : "Satellite view — track overlay unavailable for this circuit"}
          <span className="ml-1 text-muted">· lines are geometry-modelled, not telemetry</span>
        </p>
      </div>
    </div>
  );
}
