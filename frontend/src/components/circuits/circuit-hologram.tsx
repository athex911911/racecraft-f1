"use client";

import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

/**
 * A holographic top-down circuit with three racing lines.
 *
 * Honest note: we have no lap telemetry or surveyed track geometry, so this is
 * an *illustrative* model, not a map. The loop is generated deterministically
 * from the circuit ref (so each track looks its own, and identically every
 * visit) and shaped by the real corner count; the three lines are derived from
 * apex geometry — aggressive apex-cutting (fastest) through to a central,
 * conservative line (slowest).
 */

const SIZE = 340;
const CENTER = SIZE / 2;
const BASE_R = 100;
const AMP_BUDGET = 0.5; // keeps radius > 0 (star-convex => never self-intersects)
const HALF_WIDTH = 13; // how far a racing line may swing from the centre
const ASPHALT = 32; // drawn track width
const SAMPLES = 260;

const LINES = [
  { key: "fastest", label: "Fastest", color: "#FF1801", note: "latest apex, hardest cut" },
  { key: "optimal", label: "Optimal", color: "#00E1FF", note: "balanced racing line" },
  { key: "slowest", label: "Slowest", color: "#FFB800", note: "conservative, stays central" },
] as const;

type LineKey = (typeof LINES)[number]["key"];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function toClosedPath(pts: { x: number; y: number }[]): string {
  if (!pts.length) return "";
  return (
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z"
  );
}

function buildTrack(circuitRef: string, corners: number) {
  const rnd = mulberry32(hashString(circuitRef));
  const TAU = Math.PI * 2;
  // low harmonics (1,2) set the overall irregular loop + a long straight; higher
  // harmonics add corner detail, with frequency driven by the real corner count.
  const midK = clamp(3 + Math.floor(rnd() * 3), 3, 6);
  const detailK = clamp(midK + 2 + Math.round(corners / 10), midK + 1, 9);
  const harms = [
    { k: 1, a: 0.9 + rnd() * 0.5, p: rnd() * TAU },
    { k: 2, a: 0.7 + rnd() * 0.5, p: rnd() * TAU },
    { k: midK, a: 0.45 + rnd() * 0.35, p: rnd() * TAU },
    { k: detailK, a: 0.28 + rnd() * 0.3, p: rnd() * TAU },
  ];
  const sumA = harms.reduce((s, h) => s + h.a, 0);
  for (const h of harms) h.a = (h.a / sumA) * AMP_BUDGET; // normalise -> radius stays > 0

  const samples: { t: number; r: number; dev: number }[] = [];
  let maxAbsDev = 1e-6;
  for (let i = 0; i < SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2;
    let dev = 0;
    for (const h of harms) dev += h.a * Math.sin(h.k * t + h.p);
    maxAbsDev = Math.max(maxAbsDev, Math.abs(dev));
    samples.push({ t, r: BASE_R * (1 + dev), dev });
  }

  const centre = samples.map((s) => ({
    x: CENTER + s.r * Math.cos(s.t),
    y: CENTER + s.r * Math.sin(s.t),
  }));

  // racing line: inside (apex) where the corner is tight, wide on the open bits
  const line = (aggr: number) =>
    toClosedPath(
      samples.map((s) => {
        const apexness = clamp(-s.dev / maxAbsDev, -1, 1); // +1 at the tightest points
        const r = s.r - HALF_WIDTH * aggr * apexness;
        return { x: CENTER + r * Math.cos(s.t), y: CENTER + r * Math.sin(s.t) };
      }),
    );

  return {
    tarmac: toClosedPath(centre),
    fastest: line(1.0),
    optimal: line(0.62),
    slowest: line(0.28),
    start: centre[0],
  };
}

export function CircuitHologram({
  circuitRef,
  corners,
}: {
  circuitRef: string;
  corners?: number | null;
}) {
  const [sel, setSel] = useState<LineKey>("optimal");
  const track = useMemo(() => buildTrack(circuitRef, corners ?? 14), [circuitRef, corners]);
  const selected = LINES.find((l) => l.key === sel)!;
  const selPath = track[sel];

  return (
    <GlassCard className="overflow-hidden">
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        {/* the hologram */}
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
            <defs>
              <radialGradient id="holo-bg" cx="50%" cy="42%" r="65%">
                <stop offset="0%" stopColor="rgba(0,225,255,0.10)" />
                <stop offset="100%" stopColor="rgba(0,225,255,0)" />
              </radialGradient>
              <pattern id="holo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="rgba(0,225,255,0.09)" strokeWidth="0.5" />
              </pattern>
              <filter id="holo-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={SIZE} height={SIZE} fill="url(#holo-grid)" />
            <rect width={SIZE} height={SIZE} fill="url(#holo-bg)" />

            {/* asphalt band + holographic centre dashes */}
            <path
              d={track.tarmac}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={ASPHALT}
              strokeLinejoin="round"
            />
            <path
              d={track.tarmac}
              fill="none"
              stroke="rgba(0,225,255,0.28)"
              strokeWidth="1"
              strokeDasharray="2 6"
              strokeLinejoin="round"
            />

            {/* the three lines — selected one bright + glowing, others recessive */}
            {LINES.map((l) => (
              <path
                key={l.key}
                d={track[l.key]}
                fill="none"
                stroke={l.color}
                strokeWidth={sel === l.key ? 2.6 : 1.4}
                strokeLinejoin="round"
                opacity={sel === l.key ? 1 : 0.25}
                filter={sel === l.key ? "url(#holo-glow)" : undefined}
              />
            ))}

            {/* start/finish tick */}
            <circle cx={track.start.x} cy={track.start.y} r="4" fill="#fff" />

            {/* a car running the selected line */}
            <circle r="4.5" fill={selected.color} filter="url(#holo-glow)">
              <animateMotion dur="5s" repeatCount="indefinite" path={selPath} rotate="auto" />
            </circle>
            <circle r="2" fill="#fff">
              <animateMotion dur="5s" repeatCount="indefinite" path={selPath} rotate="auto" />
            </circle>
          </svg>
        </div>

        {/* controls */}
        <div className="flex shrink-0 flex-col gap-2 sm:w-52">
          {LINES.map((l) => {
            const active = sel === l.key;
            return (
              <button
                key={l.key}
                onClick={() => setSel(l.key)}
                className={cn(
                  "flex items-center gap-3 rounded-lg rounded-tr-none border px-3 py-2.5 text-left transition",
                  active
                    ? "border-white/20 bg-white/[0.06]"
                    : "border-white/8 hover:border-white/15 hover:bg-white/[0.03]",
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: l.color, boxShadow: active ? `0 0 10px ${l.color}` : undefined }}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block font-display text-sm font-bold uppercase tracking-wide",
                      active ? "text-white" : "text-silver",
                    )}
                  >
                    {l.label}
                  </span>
                  <span className="block truncate text-[10px] text-muted">{l.note}</span>
                </span>
              </button>
            );
          })}
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            Illustrative racing lines — apex geometry modelled from the corner profile, not lap
            telemetry.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
