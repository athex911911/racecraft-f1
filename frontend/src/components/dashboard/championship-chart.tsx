"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionshipProgress } from "@/lib/api/hooks";
import { cn, formatPoints } from "@/lib/utils";
import type { ProgressSeries } from "@/types/f1";

const MAX_SERIES = 6;
const FALLBACK = "#8a8a8a";

export function ChampionshipChart() {
  const [entity, setEntity] = useState<"driver" | "constructor">("driver");
  const { data, isLoading } = useChampionshipProgress(entity);

  const { rows, series } = useMemo(() => {
    const top: ProgressSeries[] = (data?.series ?? []).slice(0, MAX_SERIES);
    const rounds = new Map<number, Record<string, number | string>>();
    for (const s of top) {
      for (const p of s.points) {
        const row = rounds.get(p.round) ?? { round: p.round, race: p.race_name };
        row[s.label] = p.points;
        rounds.set(p.round, row);
      }
    }
    // second entry sharing a team color gets a dash pattern so teammates stay distinct
    const seen = new Map<string, number>();
    const styled = top.map((s) => {
      const color = s.color ?? FALLBACK;
      const nth = seen.get(color) ?? 0;
      seen.set(color, nth + 1);
      return { ...s, colorResolved: color, dash: nth > 0 ? "6 4" : undefined };
    });
    return { rows: [...rounds.values()].sort((a, b) => (a.round as number) - (b.round as number)), series: styled };
  }, [data]);

  return (
    <section>
      <SectionHeading
        title="Championship Progress"
        subtitle={`Cumulative points by round · top ${MAX_SERIES}`}
        action={
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(["driver", "constructor"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setEntity(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition",
                  entity === t ? "bg-f1-red text-white" : "text-silver hover:text-white",
                )}
              >
                {t}s
              </button>
            ))}
          </div>
        }
      />

      <GlassCard className="p-4 sm:p-6">
        {isLoading ? (
          <Skeleton className="h-[340px]" />
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No results ingested yet.</p>
        ) : (
          <>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 8, right: 46, bottom: 4, left: 4 }}>
                  <CartesianGrid stroke="#242424" strokeWidth={1} vertical={false} />
                  <XAxis
                    dataKey="round"
                    tick={{ fill: "#8a8a8a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#2e2e2e" }}
                    tickFormatter={(r) => `R${r}`}
                  />
                  <YAxis
                    tick={{ fill: "#8a8a8a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<ProgressTooltip series={series} />} cursor={{ stroke: "#3d3d3d", strokeWidth: 1 }} />
                  {series.map((s) => (
                    <Line
                      key={s.label}
                      type="monotone"
                      dataKey={s.label}
                      stroke={s.colorResolved}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeDasharray={s.dash}
                      dot={false}
                      activeDot={{ r: 4, stroke: "#161616", strokeWidth: 2 }}
                      isAnimationActive
                      animationDuration={600}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* legend — identity never by color alone */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/5 pt-3">
              {series.map((s) => (
                <span key={s.label} className="flex items-center gap-2 text-xs text-silver">
                  <svg width="18" height="6" aria-hidden>
                    <line
                      x1="1"
                      y1="3"
                      x2="17"
                      y2="3"
                      stroke={s.colorResolved}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={s.dash}
                    />
                  </svg>
                  {s.label}
                </span>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}

function ProgressTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
  series: { label: string; colorResolved: string; dash?: string }[];
}) {
  if (!active || !payload?.length) return null;
  const race = (payload[0] as unknown as { payload?: { race?: string } }).payload?.race;
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="glass rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-foreground">
        Round {label}
        {race ? <span className="font-normal text-muted"> · {race}</span> : null}
      </p>
      <div className="space-y-1">
        {sorted.map((entry) => {
          const s = series.find((x) => x.label === entry.name);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <svg width="14" height="4" aria-hidden>
                <line
                  x1="0"
                  y1="2"
                  x2="14"
                  y2="2"
                  stroke={s?.colorResolved ?? entry.color}
                  strokeWidth="2"
                  strokeDasharray={s?.dash}
                />
              </svg>
              <span className="font-bold tabular-nums text-foreground">
                {formatPoints(entry.value)}
              </span>
              <span className="text-muted">{entry.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
