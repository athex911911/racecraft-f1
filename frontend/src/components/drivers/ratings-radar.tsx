"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { DriverRating } from "@/types/f1";

/**
 * Six-axis performance radar. One series (this driver), so the card title
 * carries identity — no legend needed. Values are 0–100 normalised scores;
 * the raw statistic rides along in each point's `detail` for the tooltip.
 */
export function RatingsRadar({ ratings }: { ratings: DriverRating[] }) {
  if (ratings.length < 3) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        Not enough races to compute a rating profile.
      </p>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={ratings} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#242424" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "#bfbfbf", fontSize: 11 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
          <Radar
            dataKey="value"
            stroke="#e10600"
            strokeWidth={2}
            fill="#e10600"
            fillOpacity={0.22}
            isAnimationActive
            animationDuration={600}
            dot={{ r: 3, fill: "#e10600", stroke: "#161616", strokeWidth: 1 }}
          />
          <Tooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DriverRating }[];
}) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{r.label}</p>
      <p className="mt-0.5">
        <span className="font-display font-bold tabular-nums text-f1-red">{r.value}</span>
        <span className="text-muted"> / 100</span>
      </p>
      <p className="mt-0.5 text-muted">{r.detail}</p>
    </div>
  );
}
