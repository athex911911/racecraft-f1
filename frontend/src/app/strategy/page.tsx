"use client";

import { TriangleAlert, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { useStrategyCircuits, useStrategySim } from "@/lib/api/hooks";
import { CIRCUIT_GEO } from "@/lib/design/circuit-tracks-geo";
import { cn } from "@/lib/utils";
import type { StrategyOption, StrategyStint } from "@/types/f1";

// Leaflet needs the browser — load the satellite heatmap client-side only.
const CircuitHeatmap = dynamic(
  () => import("@/components/circuits/circuit-heatmap").then((m) => m.CircuitHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-[460px] w-full sm:h-[580px]" /> },
);

const DEG_MODES = [
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
] as const;

/** m:ss.s for lap times, s.s under a minute. */
function fmtLap(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return m > 0 ? `${m}:${sec.toFixed(1).padStart(4, "0")}` : sec.toFixed(1);
}

/** dark or light text for a compound swatch. */
function textOn(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0d0d0d" : "#ffffff";
}

export default function StrategyPage() {
  const { data: circuits, isLoading: loadingCircuits, isError } = useStrategyCircuits();
  const [circuitRef, setCircuitRef] = useState<string | undefined>(undefined);
  const [degMode, setDegMode] = useState<string>("normal");
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  const activeRef = circuitRef ?? circuits?.[0]?.circuit_ref;
  const { data: sim, isLoading: loadingSim } = useStrategySim(activeRef, degMode);

  const active = sim?.strategies.find((s) => s.key === selectedKey)
    ?? sim?.strategies.find((s) => s.key === sim.optimal_key);

  const onCalendar = useMemo(() => circuits?.filter((c) => c.on_calendar) ?? [], [circuits]);
  const others = useMemo(() => circuits?.filter((c) => !c.on_calendar) ?? [], [circuits]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeading
        title="Strategy Simulator"
        subtitle="Deterministic tyre + fuel model over the race distance — find the pace-optimal pit strategy"
        action={
          circuits && circuits.length ? (
            <select
              value={activeRef}
              onChange={(e) => {
                setCircuitRef(e.target.value);
                setSelectedKey(undefined);
              }}
              className="max-w-[240px] rounded-lg border border-white/10 bg-carbon-800 px-3 py-2 text-sm text-silver outline-none transition focus:border-f1-red/50"
              aria-label="Choose a circuit"
            >
              <optgroup label="2026 Calendar">
                {onCalendar.map((c) => (
                  <option key={c.circuit_ref} value={c.circuit_ref}>
                    {c.name.replace(" Grand Prix Circuit", "").replace(" Circuit", "")}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other circuits">
                {others.map((c) => (
                  <option key={c.circuit_ref} value={c.circuit_ref}>
                    {c.name.replace(" Grand Prix Circuit", "").replace(" Circuit", "")}
                  </option>
                ))}
              </optgroup>
            </select>
          ) : null
        }
      />

      {isError ? (
        <GlassCard className="flex items-center gap-3 px-5 py-6 text-sm text-muted">
          <TriangleAlert className="h-4 w-4 text-f1-red" />
          Strategy service unavailable — is the backend running?
        </GlassCard>
      ) : loadingCircuits || loadingSim || !sim || !active ? (
        <StrategySkeleton />
      ) : (
        <>
          {/* controls + circuit params */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 flex flex-col justify-center gap-1.5 rounded-card rounded-tr-none border border-white/8 bg-carbon-700 px-4 py-3 sm:col-span-1 lg:col-span-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Tyre wear
              </span>
              <div className="flex rounded-lg border border-white/10 p-0.5">
                {DEG_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setDegMode(m.key);
                      setSelectedKey(undefined);
                    }}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1 text-xs font-semibold transition",
                      degMode === m.key ? "bg-f1-red text-white" : "text-silver hover:text-white",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <StatTile label="Race Laps" value={sim.circuit.laps} />
            <StatTile label="Base Lap" value={sim.circuit.base_lap_str} sub="fastest race lap" />
            <StatTile label="Pit Loss" value={`${sim.circuit.pit_loss_s}s`} sub="lane time cost" />
            <StatTile
              label="Optimal"
              value={sim.optimal_key.replace("-stop", "")}
              sub={
                sim.circuit.real_avg_stops != null
                  ? `real avg ${sim.circuit.real_avg_stops}`
                  : sim.optimal_key.includes("1")
                    ? "stop"
                    : "stops"
              }
              accent
            />
          </div>

          {/* strategy comparison cards */}
          <div>
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-silver">
              Strategy Comparison
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {sim.strategies.map((s) => (
                <StrategyCard
                  key={s.key}
                  option={s}
                  laps={sim.circuit.laps}
                  isOptimal={s.key === sim.optimal_key}
                  isSelected={s.key === active.key}
                  onSelect={() => setSelectedKey(s.key)}
                />
              ))}
            </div>
          </div>

          {/* lap-time evolution for the selected strategy */}
          <div>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-silver">
                Lap-Time Evolution
              </h3>
              <p className="text-xs text-muted">
                {active.label} · {active.compound_sequence.join(" → ")} · sawtooth = tyre wear, drops
                = fresh rubber &amp; lighter fuel
              </p>
            </div>
            <GlassCard className="p-4 sm:p-6">
              <PaceChart option={active} laps={sim.circuit.laps} />
            </GlassCard>
          </div>

          {/* modelled speed / throttle / braking heatmap on the real circuit */}
          {CIRCUIT_GEO[sim.circuit.circuit_ref] ? (
            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-silver">
                  Performance Heatmap
                </h3>
                <p className="text-xs text-muted">
                  {sim.circuit.name.replace(" Grand Prix Circuit", "").replace(" Circuit", "")} ·
                  modelled speed, throttle &amp; braking — heavy-braking zones drive tyre wear
                </p>
              </div>
              <CircuitHeatmap circuitRef={sim.circuit.circuit_ref} />
            </div>
          ) : null}

          {/* compound legend + honest model note */}
          <GlassCard className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              {sim.compounds.map((c) => (
                <span key={c.key} className="flex items-center gap-2 text-xs text-silver">
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-white/20"
                    style={{ background: c.color }}
                  />
                  {c.name}
                  <span className="text-muted">
                    {c.offset === 0 ? "ref pace" : `+${c.offset.toFixed(2)}s`} · {c.deg.toFixed(3)}
                    s/lap wear
                  </span>
                </span>
              ))}
            </div>
          </GlassCard>

          <p className="pb-2 text-center text-[11px] text-muted">
            Deterministic model — race distance &amp; reference pace are from ingested results.
            {sim.circuit.calibrated
              ? " Tyre severity is calibrated from real FastF1 stint lengths at this circuit."
              : " Tyre-degradation and pit-loss are calibrated parameters."}{" "}
            Optimises for lap time, not track position or safety cars.
          </p>
        </>
      )}
    </div>
  );
}

function StintGantt({ stints, laps }: { stints: StrategyStint[]; laps: number }) {
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-md ring-1 ring-white/10">
      {stints.map((s, i) => (
        <div
          key={i}
          className="flex items-center justify-center border-r border-black/40 last:border-r-0"
          style={{ width: `${(s.laps / laps) * 100}%`, background: s.color, color: textOn(s.color) }}
          title={`${s.name}: laps ${s.start_lap}–${s.end_lap}`}
        >
          <span className="font-display text-xs font-bold tabular-nums">
            {s.laps >= 4 ? `${s.name[0]}${s.laps}` : s.name[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

function StrategyCard({
  option,
  laps,
  isOptimal,
  isSelected,
  onSelect,
}: {
  option: StrategyOption;
  laps: number;
  isOptimal: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-3 rounded-card rounded-tr-none border p-4 text-left transition",
        isSelected
          ? "border-f1-red/70 bg-f1-red/[0.06] shadow-[0_10px_30px_-14px_rgba(255,24,1,0.5)]"
          : "border-white/8 bg-carbon-700 hover:border-white/20",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-bold">{option.label}</span>
        {isOptimal ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success ring-1 ring-success/30">
            <Trophy className="h-3 w-3" /> Fastest
          </span>
        ) : (
          <span className="text-xs font-semibold text-muted">+{option.delta_s.toFixed(1)}s</span>
        )}
      </div>

      <StintGantt stints={option.stints} laps={laps} />

      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-xl font-bold tabular-nums">{option.total_time_str}</p>
          <p className="text-[11px] text-muted">
            avg {fmtLap(option.avg_lap_s)} · {option.compound_sequence.join(" / ")}
          </p>
        </div>
      </div>
    </button>
  );
}

function PaceChart({ option, laps }: { option: StrategyOption; laps: number }) {
  const data = useMemo(
    () => option.lap_pace.map((t, i) => ({ lap: i + 1, time: t })),
    [option],
  );
  const [min, max] = useMemo(() => {
    const vals = option.lap_pace;
    return [Math.min(...vals) - 0.4, Math.max(...vals) + 0.4];
  }, [option]);

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 6 }}>
          {/* compound band per stint */}
          {option.stints.map((s, i) => (
            <ReferenceArea
              key={i}
              x1={s.start_lap}
              x2={s.end_lap}
              y1={min}
              y2={max}
              fill={s.color}
              fillOpacity={0.1}
              stroke="none"
            />
          ))}
          {/* pit-stop markers */}
          {option.pits.map((lap) => (
            <ReferenceLine
              key={lap}
              x={lap}
              stroke="#ffffff"
              strokeOpacity={0.5}
              strokeDasharray="3 4"
              label={{ value: "PIT", fill: "#9b9b9b", fontSize: 9, position: "top" }}
            />
          ))}
          <CartesianGrid stroke="#1e1e1e" vertical={false} />
          <XAxis
            dataKey="lap"
            tick={{ fill: "#8a8a8a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#2e2e2e" }}
            tickFormatter={(l) => `${l}`}
            domain={[1, laps]}
            type="number"
          />
          <YAxis
            tick={{ fill: "#8a8a8a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={46}
            domain={[min, max]}
            tickFormatter={(v) => fmtLap(v)}
          />
          <Tooltip content={<PaceTooltip stints={option.stints} />} cursor={{ stroke: "#3d3d3d" }} />
          <Line
            type="monotone"
            dataKey="time"
            stroke="#FF1801"
            strokeWidth={2.25}
            dot={false}
            activeDot={{ r: 4, stroke: "#0b0b0b", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaceTooltip({
  active,
  payload,
  label,
  stints,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
  stints: StrategyStint[];
}) {
  if (!active || !payload?.length || label == null) return null;
  const stint = stints.find((s) => label >= s.start_lap && label <= s.end_lap);
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">Lap {label}</p>
      <p className="tabular-nums text-silver">{fmtLap(payload[0].value)}</p>
      {stint ? (
        <p className="mt-0.5 flex items-center gap-1.5 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: stint.color }} />
          {stint.name} · lap {label - stint.start_lap + 1} of stint
        </p>
      ) : null}
    </div>
  );
}

function StrategySkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
      <Skeleton className="h-[380px]" />
    </div>
  );
}
