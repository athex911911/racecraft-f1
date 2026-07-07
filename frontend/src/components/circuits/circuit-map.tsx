"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { CIRCUIT_GEO } from "@/lib/design/circuit-tracks-geo";
import { CIRCUIT_META, type CircuitMeta } from "@/lib/design/circuit-meta";
import { cn } from "@/lib/utils";

/**
 * Real aerial view of the circuit (Esri World Imagery satellite tiles) with the
 * three racing lines and track labels drawn on top. Because everything is
 * computed in real lat/lng it sits exactly on the tarmac. Zoom/pan is native
 * Leaflet (button-only).
 *
 * The track shape is real (bacinger/f1-circuits). The racing lines are a
 * geometry model (inside-of-corner offset); the start/finish, sector splits and
 * turn numbers are derived from the geometry too — indicative, not official
 * timing data.
 */

type LL = [number, number];
type XY = [number, number];

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

type Labels = {
  startBar: [LL, LL];
  startLabelPos: LL;
  splits: [LL, LL][];
  sectors: { label: string; pos: LL }[];
  turns: { n: number; name?: string; major?: boolean; pos: LL }[];
  official: boolean;
};

/**
 * Derive on-track labels from the real geometry:
 *  - start/finish bar at the trace origin (index 0)
 *  - two sector split bars at 1/3 and 2/3 of the lap distance (even splits)
 *  - numbered turns at curvature peaks
 * All placed in real lat/lng so they land on the tarmac.
 */
function deriveLabels(track: LL[], meta?: CircuitMeta): Labels {
  const n = track.length;
  const lat0 = track.reduce((s, p) => s + p[0], 0) / n;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  const toM = ([la, ln]: LL): XY => [ln * kx, la * ky];
  const toLL = ([x, y]: XY): LL => [y / ky, x / kx];
  const P = track.map(toM);
  const at = (i: number) => P[((i % n) + n) % n];
  const cx = P.reduce((s, p) => s + p[0], 0) / n;
  const cy = P.reduce((s, p) => s + p[1], 0) / n;

  // cumulative arc length around the loop
  const cum: number[] = [0];
  for (let i = 1; i < n; i++) {
    cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  }
  const total = cum[n - 1];

  // a bar across the track, perpendicular to travel, half-width in metres
  const barAt = (i: number, half: number): [LL, LL] => {
    const a = at(i - 3);
    const b = at(i + 3);
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const nx = -ty;
    const ny = tx; // unit normal
    const c = at(i);
    return [toLL([c[0] + nx * half, c[1] + ny * half]), toLL([c[0] - nx * half, c[1] - ny * half])];
  };

  // push a label off the track, away from the circuit centroid, by `dist` metres
  const outward = (i: number, dist: number): LL => {
    const c = at(i);
    let dx = c[0] - cx;
    let dy = c[1] - cy;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    return toLL([c[0] + dx * dist, c[1] + dy * dist]);
  };

  const idxAtDist = (d: number) => {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(cum[i] - d);
      if (diff < bd) {
        bd = diff;
        best = i;
      }
    }
    return best;
  };

  // ---- official corner table (when we have one) --------------------------
  if (meta) {
    const sf = meta.sf ?? 0;
    // fraction from S/F → geometry index (the trace may not start at S/F)
    const fi = (t: number) => idxAtDist((((sf + t) % 1) + 1) % 1 * total);
    const [s1, s2] = meta.sectors;
    return {
      startBar: barAt(fi(0), 26),
      startLabelPos: outward(fi(0), 34),
      splits: [barAt(fi(s1), 20), barAt(fi(s2), 20)],
      sectors: [
        { label: "S1", pos: outward(fi(s1 / 2), 30) },
        { label: "S2", pos: outward(fi((s1 + s2) / 2), 30) },
        { label: "S3", pos: outward(fi((s2 + 1) / 2), 30) },
      ],
      turns: meta.turns.map((tt) => ({
        n: tt.n,
        name: tt.name,
        major: tt.major,
        pos: outward(fi(tt.t), tt.major ? 24 : 15),
      })),
      official: true,
    };
  }

  // ---- turns: curvature peaks --------------------------------------------
  const ang: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = at(i - 2);
    const b = at(i);
    const c = at(i + 2);
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let d = h2 - h1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    ang.push(Math.abs(d));
  }
  const sm = ang.map((_, i) => {
    let s = 0;
    for (let j = -1; j <= 1; j++) s += ang[((i + j) % n + n) % n];
    return s / 3;
  });
  const THRESH = 0.16; // rad — how sharp a kink must be to count as a turn
  const MIN_GAP = Math.max(4, Math.round(n * 0.028));
  const picks: number[] = [];
  for (let i = 0; i < n; i++) {
    if (sm[i] < THRESH) continue;
    let isMax = true;
    for (let j = -2; j <= 2; j++) {
      if (sm[((i + j) % n + n) % n] > sm[i]) {
        isMax = false;
        break;
      }
    }
    if (!isMax) continue;
    const tooClose = picks.some((p) => Math.min(Math.abs(p - i), n - Math.abs(p - i)) < MIN_GAP);
    if (tooClose) continue;
    picks.push(i);
  }
  picks.sort((a, b) => a - b);
  const turns = picks.map((idx, k) => ({ n: k + 1, pos: outward(idx, 16) }));

  const b1 = idxAtDist(total / 3);
  const b2 = idxAtDist((2 * total) / 3);

  return {
    startBar: barAt(0, 24),
    startLabelPos: outward(0, 34),
    splits: [barAt(b1, 20), barAt(b2, 20)],
    sectors: [
      { label: "S1", pos: outward(idxAtDist(total / 6), 30) },
      { label: "S2", pos: outward(idxAtDist(total / 2), 30) },
      { label: "S3", pos: outward(idxAtDist((5 * total) / 6), 30) },
    ],
    turns,
    official: false,
  };
}

// ---- label icons (inline styles → no global CSS, dodges the dev CSS cache) --
function turnIcon(n: number, name?: string, major?: boolean) {
  if (major && name) {
    return L.divIcon({
      className: "",
      html: `<div style="display:flex;align-items:center;gap:5px;padding:2px 8px 2px 2px;border-radius:9999px;background:rgba(13,13,13,0.88);border:1px solid rgba(255,255,255,0.5);box-shadow:0 1px 5px rgba(0,0,0,0.75);white-space:nowrap"><span style="display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:9999px;background:#FF1801;color:#fff;font:800 10px/1 var(--font-barlow,sans-serif)">${n}</span><span style="color:#f5f5f5;font:700 10px/1 var(--font-barlow,sans-serif);letter-spacing:0.02em">${name}</span></div>`,
      iconSize: [Math.round(28 + name.length * 6.4), 20],
      iconAnchor: [11, 10],
    });
  }
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:9999px;background:rgba(13,13,13,0.82);border:1px solid rgba(255,255,255,0.55);color:#fff;font:700 10px/1 var(--font-barlow,sans-serif);box-shadow:0 1px 4px rgba(0,0,0,0.7)">${n}</div>`,
    iconSize: [19, 19],
    iconAnchor: [10, 10],
  });
}

function sectorIcon(label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="padding:2px 7px;border-radius:5px;border-top-right-radius:0;background:rgba(13,13,13,0.85);border:1px solid rgba(255,255,255,0.28);color:#f5f5f5;font:700 10px/1 var(--font-barlow,sans-serif);letter-spacing:0.1em;box-shadow:0 1px 4px rgba(0,0,0,0.7)">${label}</div>`,
    iconSize: [30, 17],
    iconAnchor: [15, 8],
  });
}

function startIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;border-top-right-radius:0;background:rgba(13,13,13,0.9);border:1px solid rgba(255,255,255,0.4);color:#fff;font:700 9px/1 var(--font-barlow,sans-serif);letter-spacing:0.12em;white-space:nowrap;box-shadow:0 2px 7px rgba(0,0,0,0.7)"><span style="width:10px;height:10px;background-image:conic-gradient(#fff 90deg,#111 90deg 180deg,#fff 180deg 270deg,#111 270deg);background-size:5px 5px"></span>START / FINISH</div>`,
    iconSize: [116, 20],
    iconAnchor: [58, 26],
  });
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
  const [showLabels, setShowLabels] = useState(true);
  const track = CIRCUIT_GEO[circuitRef] as LL[] | undefined;
  const meta = CIRCUIT_META[circuitRef];
  const lines = useMemo(() => (track ? deriveLines(track) : null), [track]);
  const labels = useMemo(() => (track ? deriveLabels(track, meta) : null), [track, meta]);
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

          {/* track labels: start/finish, sector splits, turn numbers */}
          {labels && showLabels ? (
            <>
              <Polyline
                positions={labels.startBar}
                pathOptions={{ color: "#000", weight: 9, opacity: 0.5 }}
              />
              <Polyline
                positions={labels.startBar}
                pathOptions={{ color: "#fff", weight: 5, opacity: 0.95 }}
              />
              <Marker position={labels.startLabelPos} icon={startIcon()} interactive={false} />

              {labels.splits.map((bar, i) => (
                <Polyline
                  key={`split-${i}`}
                  positions={bar}
                  pathOptions={{ color: "#fff", weight: 3, opacity: 0.85, dashArray: "3 5" }}
                />
              ))}
              {labels.sectors.map((s) => (
                <Marker key={s.label} position={s.pos} icon={sectorIcon(s.label)} interactive={false} />
              ))}

              {labels.turns.map((t) => (
                <Marker
                  key={`turn-${t.n}`}
                  position={t.pos}
                  icon={turnIcon(t.n, t.name, t.major)}
                  interactive={false}
                />
              ))}
            </>
          ) : null}
        </MapContainer>
      </div>

      {/* line selector + label toggle, over the map */}
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
        <div className="my-0.5 h-px bg-white/10" />
        <button
          onClick={() => setShowLabels((v) => !v)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg rounded-tr-none border px-3 py-2 text-left backdrop-blur transition",
            showLabels
              ? "border-white/25 bg-black/70"
              : "border-white/10 bg-black/45 hover:bg-black/60",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none" aria-hidden>
            <path
              d="M2 4.5A1.5 1.5 0 0 1 3.5 3h4.3c.4 0 .78.16 1.06.44l4.7 4.7a1.5 1.5 0 0 1 0 2.12l-2.3 2.3a1.5 1.5 0 0 1-2.12 0l-4.7-4.7A1.5 1.5 0 0 1 6 6.8V4.5z"
              stroke={showLabels ? "#fff" : "#c8c8c8"}
              strokeWidth="1.2"
            />
            <circle cx="5.5" cy="6" r="1" fill={showLabels ? "#FF1801" : "#9b9b9b"} />
          </svg>
          <span
            className={cn(
              "font-display text-xs font-bold uppercase tracking-wide",
              showLabels ? "text-white" : "text-silver",
            )}
          >
            Labels
          </span>
        </button>
      </div>

      {/* caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900] bg-gradient-to-t from-black/70 to-transparent px-4 pb-2.5 pt-8">
        <p className="text-[10px] text-silver">
          {track
            ? `${LINES.find((l) => l.key === sel)!.label} line · ${LINES.find((l) => l.key === sel)!.note}`
            : "Satellite view — track overlay unavailable for this circuit"}
          <span className="ml-1 text-muted">
            {labels?.official
              ? "· official corner names · positions & sectors approximate"
              : "· lines & labels are geometry-modelled, not telemetry"}
          </span>
        </p>
      </div>
    </div>
  );
}
