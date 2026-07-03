"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPoints, ordinal } from "@/lib/utils";
import type { DriverSeasonStat } from "@/types/f1";

/**
 * Points per season. Magnitude is the bar height; each bar is tinted with that
 * season's constructor colour, so a driver's team eras read at a glance. The
 * team colour is a label the tooltip and season table repeat — never the sole cue.
 */
export function SeasonPointsChart({ seasons }: { seasons: DriverSeasonStat[] }) {
  if (seasons.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">No seasons ingested.</p>;
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={seasons}
          margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
          barCategoryGap="24%"
        >
          <XAxis
            dataKey="season"
            tick={{ fill: "#8a8a8a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#2e2e2e" }}
          />
          <YAxis
            tick={{ fill: "#8a8a8a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<SeasonTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="points" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
            {seasons.map((s) => (
              <Cell key={s.season} fill={s.constructor?.color ?? "#e10600"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SeasonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DriverSeasonStat }[];
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-foreground">
        {s.season}
        {s.constructor ? <span className="font-normal text-muted"> · {s.constructor.name}</span> : null}
      </p>
      <div className="space-y-0.5 text-silver">
        <p>
          <span className="font-bold tabular-nums text-foreground">{formatPoints(s.points)}</span> points
        </p>
        <p className="tabular-nums">
          {s.wins} wins · {s.podiums} podiums · {s.poles} poles
        </p>
        {s.championship_position ? (
          <p className="text-muted">Championship: {ordinal(s.championship_position)}</p>
        ) : null}
      </div>
    </div>
  );
}
