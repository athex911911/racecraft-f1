"use client";

import { format } from "date-fns";
import { Medal, Rocket, Timer, Zap } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestRaceSummary } from "@/lib/api/hooks";
import { cn, countryFlag } from "@/lib/utils";

const PODIUM_STYLES = [
  "border-warning/50 bg-warning/10", // P1
  "border-white/20 bg-white/5", // P2
  "border-[#CD7F32]/50 bg-[#CD7F32]/10", // P3
];

export function LatestRaceSummary() {
  const { data: race, isLoading } = useLatestRaceSummary();

  return (
    <section>
      <SectionHeading title="Latest Race" subtitle="Result highlights from the most recent Grand Prix" />
      <GlassCard className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-64" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : !race ? (
          <p className="text-sm text-muted">No completed race yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-bold">
                {countryFlag(race.circuit.country)} {race.name}
              </h3>
              <p className="text-xs text-muted">
                Round {race.round} · {format(new Date(race.date), "d MMMM yyyy")} ·{" "}
                {race.circuit.name}
              </p>
            </div>

            {/* podium */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {race.podium.map((p, i) => (
                <div
                  key={p.position}
                  className={cn("rounded-xl border p-4", PODIUM_STYLES[i] ?? PODIUM_STYLES[2])}
                >
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-silver" />
                    <span className="font-display text-lg font-bold">P{p.position}</span>
                  </div>
                  <p className="mt-1.5 font-semibold">{p.driver.full_name}</p>
                  <p className="text-xs text-silver">
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle"
                      style={{ background: p.constructor?.color ?? "#3d3d3d" }}
                    />
                    {p.constructor?.name}
                    {p.time_text ? <span className="text-muted"> · {p.time_text}</span> : null}
                  </p>
                </div>
              ))}
            </div>

            {/* fact row */}
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              {race.fastest_lap_driver && (
                <p className="flex items-center gap-2 text-silver">
                  <Zap className="h-4 w-4 shrink-0 text-accent" />
                  <span>
                    <span className="text-muted">Fastest lap</span>{" "}
                    <span className="font-semibold">{race.fastest_lap_driver}</span>
                    {race.fastest_lap_time ? (
                      <span className="tabular-nums text-muted"> ({race.fastest_lap_time})</span>
                    ) : null}
                  </span>
                </p>
              )}
              {race.biggest_gainer && (
                <p className="flex items-center gap-2 text-silver">
                  <Rocket className="h-4 w-4 shrink-0 text-success" />
                  <span>
                    <span className="text-muted">Biggest gain</span>{" "}
                    <span className="font-semibold">{race.biggest_gainer}</span>
                    <span className="tabular-nums text-muted"> (+{race.biggest_gain})</span>
                  </span>
                </p>
              )}
              {race.pole_sitter && (
                <p className="flex items-center gap-2 text-silver">
                  <Timer className="h-4 w-4 shrink-0 text-warning" />
                  <span>
                    <span className="text-muted">Pole position</span>{" "}
                    <span className="font-semibold">{race.pole_sitter}</span>
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}
