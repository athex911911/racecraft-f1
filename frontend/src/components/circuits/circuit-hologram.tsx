"use client";

import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { CIRCUIT_TRACKS } from "@/lib/design/circuit-tracks";
import { cn } from "@/lib/utils";

/**
 * Holographic top-down circuit with three racing lines.
 *
 * The track shape is the REAL circuit centre-line (bundled from the
 * bacinger/f1-circuits dataset, see circuit-tracks.ts); circuits missing from
 * that set fall back to a deterministic procedural loop. The three lines are
 * derived from the track's own curvature — apex-hugging (fastest) through to a
 * central, conservative line (slowest). They're a geometry model, not lap
 * telemetry, but they run through the real corners.
 */

const VB = 1000;
const CENTER = VB / 2;
const TARMAC = 46; // drawn track width
const SAMPLES = 220;

const LINES = [
  { key: "fastest", label: "Fastest", color: "#FF1801", note: "latest apex, hardest cut", aggr: 1.0 },
  { key: "optimal", label: "Optimal", color: "#00E1FF", note: "balanced racing line", aggr: 0.6 },
  { key: "slowest", label: "Slowest", color: "#FFB800", note: "conservative, stays central", aggr: 0.28 },
] as const;

type LineKey = (typeof LINES)[number]["key"];
type Pt = [number, number];

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

/** Deterministic loop for circuits we have no surveyed geometry for. */
function proceduralTrack(circuitRef: string, corners: number): Pt[] {
  const rnd = mulberry32(hashString(circuitRef));
  const TAU = Math.PI * 2;
  const midK = Math.min(6, Math.max(3, 3 + Math.floor(rnd() * 3)));
  const detailK = Math.min(9, midK + 2 + Math.round(corners / 10));
  const harms = [
    { k: 1, a: 0.9 + rnd() * 0.5, p: rnd() * TAU },
    { k: 2, a: 0.7 + rnd() * 0.5, p: rnd() * TAU },
    { k: midK, a: 0.45 + rnd() * 0.35, p: rnd() * TAU },
    { k: detailK, a: 0.28 + rnd() * 0.3, p: rnd() * TAU },
  ];
  const sumA = harms.reduce((s, h) => s + h.a, 0);
  for (const h of harms) h.a = (h.a / sumA) * 0.5;
  const R = 300;
  return Array.from({ length: SAMPLES }, (_, i) => {
    const t = (i / SAMPLES) * TAU;
    let dev = 0;
    for (const h of harms) dev += h.a * Math.sin(h.k * t + h.p);
    const r = R * (1 + dev);
    return [CENTER + r * Math.cos(t), CENTER + r * Math.sin(t)] as Pt;
  });
}

const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + " Z";

/** Racing line: pull toward the inside of each corner, smoothed around the lap. */
function racingLine(track: Pt[], aggr: number, maxAmp = 18): Pt[] {
  const n = track.length;
  const at = (i: number) => track[((i % n) + n) % n];
  // inside-of-corner vector (points to the concave side; ~0 on straights)
  const raw: Pt[] = track.map((_, i) => {
    const a = at(i - 1);
    const b = at(i);
    const c = at(i + 1);
    return [(a[0] + c[0]) / 2 - b[0], (a[1] + c[1]) / 2 - b[1]];
  });
  // smooth so the line anticipates and trails each apex
  const W = Math.max(4, Math.round(n * 0.03));
  const sm: Pt[] = raw.map((_, i) => {
    let sx = 0;
    let sy = 0;
    for (let j = -W; j <= W; j++) {
      const r = raw[((i + j) % n + n) % n];
      sx += r[0];
      sy += r[1];
    }
    const c = 2 * W + 1;
    return [sx / c, sy / c];
  });
  let maxM = 1e-6;
  for (const s of sm) maxM = Math.max(maxM, Math.hypot(s[0], s[1]));
  return track.map((p, i) => {
    const s = sm[i];
    const m = Math.hypot(s[0], s[1]);
    if (m < 1e-6) return p;
    const amt = (m / maxM) * maxAmp * aggr;
    return [p[0] + (s[0] / m) * amt, p[1] + (s[1] / m) * amt] as Pt;
  });
}

export function CircuitHologram({
  circuitRef,
  corners,
}: {
  circuitRef: string;
  corners?: number | null;
}) {
  const [sel, setSel] = useState<LineKey>("optimal");

  const { tarmac, lines, start, real } = useMemo(() => {
    const real = CIRCUIT_TRACKS[circuitRef] as Pt[] | undefined;
    const track = real ?? proceduralTrack(circuitRef, corners ?? 14);
    const lines = Object.fromEntries(
      LINES.map((l) => [l.key, toPath(racingLine(track, l.aggr))]),
    ) as Record<LineKey, string>;
    return { tarmac: toPath(track), lines, start: track[0], real: Boolean(real) };
  }, [circuitRef, corners]);

  const selected = LINES.find((l) => l.key === sel)!;

  return (
    <GlassCard className="overflow-hidden">
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[440px]">
          <svg viewBox={`0 0 ${VB} ${VB}`} className="h-full w-full">
            <defs>
              <radialGradient id="holo-bg" cx="50%" cy="42%" r="65%">
                <stop offset="0%" stopColor="rgba(0,225,255,0.10)" />
                <stop offset="100%" stopColor="rgba(0,225,255,0)" />
              </radialGradient>
              <pattern id="holo-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0V50" fill="none" stroke="rgba(0,225,255,0.09)" strokeWidth="1" />
              </pattern>
              <filter id="holo-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={VB} height={VB} fill="url(#holo-grid)" />
            <rect width={VB} height={VB} fill="url(#holo-bg)" />

            {/* asphalt band + holographic centre dashes */}
            <path
              d={tarmac}
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={TARMAC}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={tarmac}
              fill="none"
              stroke="rgba(0,225,255,0.3)"
              strokeWidth="1.5"
              strokeDasharray="3 11"
              strokeLinejoin="round"
            />

            {LINES.map((l) => (
              <path
                key={l.key}
                d={lines[l.key]}
                fill="none"
                stroke={l.color}
                strokeWidth={sel === l.key ? 6 : 3}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={sel === l.key ? 1 : 0.22}
                filter={sel === l.key ? "url(#holo-glow)" : undefined}
              />
            ))}

            <circle cx={start[0]} cy={start[1]} r="9" fill="#fff" />

            {/* a car running the selected line */}
            <circle r="11" fill={selected.color} filter="url(#holo-glow)">
              <animateMotion dur="6s" repeatCount="indefinite" path={lines[sel]} rotate="auto" />
            </circle>
            <circle r="4.5" fill="#fff">
              <animateMotion dur="6s" repeatCount="indefinite" path={lines[sel]} rotate="auto" />
            </circle>
          </svg>
        </div>

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
            {real ? "Real circuit geometry" : "Approximate layout"} · racing lines modelled from
            corner geometry, not lap telemetry.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
