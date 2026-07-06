"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { DriverVideoTile } from "@/components/f1/driver-video-tile";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompareDrivers, useDrivers } from "@/lib/api/hooks";
import { cn, formatPoints, nationalityFlag } from "@/lib/utils";
import type { DriverDetail } from "@/types/f1";

export default function ComparePage() {
  const { data: roster } = useDrivers("all");
  const options = useMemo(
    () =>
      (roster ?? [])
        .map((d) => ({ ref: d.driver.driver_ref, name: d.driver.full_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [roster],
  );

  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  // sensible defaults once the roster arrives: the two top-ranked drivers
  useEffect(() => {
    if (!a && !b && roster && roster.length >= 2) {
      setA(roster[0].driver.driver_ref);
      setB(roster[1].driver.driver_ref);
    }
  }, [roster, a, b]);

  const { data, isLoading } = useCompareDrivers(a, b);

  const colorA = data?.a.current_constructor?.color ?? "#e10600";
  let colorB = data?.b.current_constructor?.color ?? "#00d4ff";
  if (colorB === colorA) colorB = "#00d4ff";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeading title="Head to Head" subtitle="Compare any two drivers across the ingested era" />

      {/* pickers */}
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <DriverPicker value={a} onChange={setA} options={options} accent={colorA} align="left" />
        <span className="text-center font-display text-lg font-bold italic text-muted">VS</span>
        <DriverPicker value={b} onChange={setB} options={options} accent={colorB} align="right" />
      </div>

      {isLoading || !data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DriverBanner detail={data.a} color={colorA} />
            <DriverBanner detail={data.b} color={colorB} />
          </div>

          {/* head to head */}
          <section>
            <SectionHeading title="When They Met" subtitle={`${data.head_to_head.shared_races} shared races`} />
            <GlassCard className="space-y-5 p-6">
              <SplitBar
                label="Finished ahead"
                left={data.head_to_head.a_race_ahead}
                right={data.head_to_head.b_race_ahead}
                colorL={colorA}
                colorR={colorB}
              />
              <SplitBar
                label="Out-qualified"
                left={data.head_to_head.a_quali_ahead}
                right={data.head_to_head.b_quali_ahead}
                colorL={colorA}
                colorR={colorB}
              />
            </GlassCard>
          </section>

          {/* radar + career table */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <SectionHeading title="Performance Profile" subtitle="Normalised 0–100" />
              <GlassCard className="p-4 sm:p-6">
                <CompareRadar a={data.a} b={data.b} colorA={colorA} colorB={colorB} />
                <Legend a={data.a} b={data.b} colorA={colorA} colorB={colorB} />
              </GlassCard>
            </div>
            <div>
              <SectionHeading title="Career Numbers" subtitle="Across ingested seasons" />
              <GlassCard className="p-2">
                <CareerTable a={data.a} b={data.b} colorA={colorA} colorB={colorB} />
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DriverPicker({
  value,
  onChange,
  options,
  accent,
  align,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { ref: string; name: string }[];
  accent: string;
  align: "left" | "right";
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-lg border bg-carbon-800 px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none",
        align === "right" && "sm:text-right",
      )}
      style={{ borderColor: `${accent}66` }}
    >
      {options.map((o) => (
        <option key={o.ref} value={o.ref}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

function DriverBanner({ detail, color }: { detail: DriverDetail; color: string }) {
  return (
    <DriverVideoTile driver={detail.driver} teamColor={color} className="h-72 sm:h-80">
      <p className="truncate font-display text-2xl font-bold uppercase italic leading-none">
        {nationalityFlag(detail.driver.nationality)} {detail.driver.full_name}
      </p>
      <p className="mt-1.5 truncate text-sm text-silver">
        <span
          className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle"
          style={{ background: color }}
        />
        {detail.current_constructor?.name ?? "—"}
      </p>
      <div className="mt-3 flex gap-5 border-t border-white/15 pt-2.5">
        <TileStat label="Races" value={detail.career.races} />
        <TileStat label="Wins" value={detail.career.wins} />
        <TileStat label="Titles" value={detail.career.titles} />
      </div>
    </DriverVideoTile>
  );
}

function TileStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}

function SplitBar({
  label,
  left,
  right,
  colorL,
  colorR,
}: {
  label: string;
  left: number;
  right: number;
  colorL: string;
  colorR: string;
}) {
  const total = left + right || 1;
  const lPct = (left / total) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-display text-lg font-bold tabular-nums" style={{ color: colorL }}>
          {left}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
        <span className="font-display text-lg font-bold tabular-nums" style={{ color: colorR }}>
          {right}
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
        <div style={{ width: `${lPct}%`, background: colorL }} />
        <div style={{ width: `${100 - lPct}%`, background: colorR }} />
      </div>
    </div>
  );
}

function CompareRadar({
  a,
  b,
  colorA,
  colorB,
}: {
  a: DriverDetail;
  b: DriverDetail;
  colorA: string;
  colorB: string;
}) {
  const labels = Array.from(new Set([...a.ratings, ...b.ratings].map((r) => r.label)));
  const data = labels.map((label) => ({
    label,
    a: a.ratings.find((r) => r.label === label)?.value ?? 0,
    b: b.ratings.find((r) => r.label === label)?.value ?? 0,
  }));

  if (data.length < 3) {
    return <p className="py-16 text-center text-sm text-muted">Not enough data to compare.</p>;
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#242424" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "#bfbfbf", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="a" stroke={colorA} strokeWidth={2} fill={colorA} fillOpacity={0.18} isAnimationActive animationDuration={600} />
          <Radar dataKey="b" stroke={colorB} strokeWidth={2} fill={colorB} fillOpacity={0.14} isAnimationActive animationDuration={600} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
                  <p className="mb-1 font-semibold">{label}</p>
                  <p style={{ color: colorA }}>{a.driver.full_name}: {payload[0]?.value}</p>
                  <p style={{ color: colorB }}>{b.driver.full_name}: {payload[1]?.value}</p>
                </div>
              ) : null
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Legend({ a, b, colorA, colorB }: { a: DriverDetail; b: DriverDetail; colorA: string; colorB: string }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1.5 border-t border-white/5 pt-3 text-xs">
      {[
        { d: a, c: colorA },
        { d: b, c: colorB },
      ].map(({ d, c }) => (
        <span key={d.driver.id} className="flex items-center gap-2 text-silver">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
          {d.driver.full_name}
        </span>
      ))}
    </div>
  );
}

function CareerTable({
  a,
  b,
  colorA,
  colorB,
}: {
  a: DriverDetail;
  b: DriverDetail;
  colorA: string;
  colorB: string;
}) {
  const rows: { label: string; a: number; b: number; lowerBetter?: boolean; fmt?: (n: number) => string }[] = [
    { label: "Titles", a: a.career.titles, b: b.career.titles },
    { label: "Wins", a: a.career.wins, b: b.career.wins },
    { label: "Poles", a: a.career.poles, b: b.career.poles },
    { label: "Podiums", a: a.career.podiums, b: b.career.podiums },
    { label: "Fastest Laps", a: a.career.fastest_laps, b: b.career.fastest_laps },
    { label: "Points", a: a.career.points, b: b.career.points, fmt: formatPoints },
    { label: "Races", a: a.career.races, b: b.career.races },
    {
      label: "Avg Finish",
      a: a.career.avg_finish ?? 99,
      b: b.career.avg_finish ?? 99,
      lowerBetter: true,
      fmt: (n) => `P${n.toFixed(1)}`,
    },
  ];

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => {
          const aWins = r.lowerBetter ? r.a < r.b : r.a > r.b;
          const bWins = r.lowerBetter ? r.b < r.a : r.b > r.a;
          const fmt = r.fmt ?? ((n: number) => String(n));
          return (
            <tr key={r.label} className="border-b border-white/4 last:border-0">
              <td className="px-3 py-2.5 text-right">
                <span
                  className={cn("font-display text-base font-bold tabular-nums", aWins ? "" : "text-muted")}
                  style={aWins ? { color: colorA } : undefined}
                >
                  {fmt(r.a)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center text-[10px] uppercase tracking-widest text-muted">
                {r.label}
              </td>
              <td className="px-3 py-2.5 text-left">
                <span
                  className={cn("font-display text-base font-bold tabular-nums", bWins ? "" : "text-muted")}
                  style={bWins ? { color: colorB } : undefined}
                >
                  {fmt(r.b)}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
