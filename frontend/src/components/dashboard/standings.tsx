"use client";

import { useState } from "react";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { LastFiveChips } from "@/components/f1/last-five-chips";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructorStandings, useDriverStandings } from "@/lib/api/hooks";
import { cn, formatPoints, nationalityFlag } from "@/lib/utils";

type Tab = "drivers" | "constructors";

export function Standings() {
  const [tab, setTab] = useState<Tab>("drivers");
  const drivers = useDriverStandings();
  const constructors = useConstructorStandings();

  return (
    <section>
      <SectionHeading
        title="Championship Standings"
        subtitle="Live points, wins, podiums and recent form"
        action={
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(["drivers", "constructors"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition",
                  tab === t ? "bg-f1-red text-white" : "text-silver hover:text-white",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <GlassCard className="overflow-hidden">
        {tab === "drivers" ? (
          drivers.isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-widest text-muted">
                    <th className="px-4 py-3 font-medium">Pos</th>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 text-right font-medium">Points</th>
                    <th className="px-4 py-3 text-right font-medium">Wins</th>
                    <th className="px-4 py-3 text-right font-medium">Podiums</th>
                    <th className="px-4 py-3 font-medium">Last 5</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.data?.map((s) => (
                    <tr
                      key={s.driver.id}
                      className="border-b border-white/4 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-2.5 font-display font-bold tabular-nums">
                        <span className={cn(s.position === 1 && "text-f1-red")}>{s.position}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <DriverAvatar
                            driver={s.driver}
                            teamColor={s.constructor?.color}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {nationalityFlag(s.driver.nationality)}{" "}
                              {s.driver.full_name}
                            </p>
                            <p className="text-[11px] text-muted">
                              #{s.driver.number ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                          style={{ background: s.constructor?.color ?? "#3d3d3d" }}
                        />
                        <span className="text-silver">{s.constructor?.name ?? "—"}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-display font-bold tabular-nums">
                        {formatPoints(s.points)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-silver">{s.wins}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-silver">
                        {s.podiums}
                      </td>
                      <td className="px-4 py-2.5">
                        <LastFiveChips results={s.last_five} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : constructors.isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-widest text-muted">
                  <th className="px-4 py-3 font-medium">Pos</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Drivers</th>
                  <th className="px-4 py-3 text-right font-medium">Points</th>
                  <th className="px-4 py-3 text-right font-medium">Wins</th>
                  <th className="px-4 py-3 text-right font-medium">Podiums</th>
                  <th className="px-4 py-3 font-medium">Form</th>
                </tr>
              </thead>
              <tbody>
                {constructors.data?.map((s) => (
                  <tr
                    key={s.constructor.id}
                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5 font-display font-bold tabular-nums">
                      <span className={cn(s.position === 1 && "text-f1-red")}>{s.position}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-1.5 rounded-full"
                          style={{ background: s.constructor.color ?? "#3d3d3d" }}
                        />
                        <span className="font-semibold">{s.constructor.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-silver">
                      {s.drivers.map((d) => d.code ?? d.full_name.split(" ").at(-1)).join(" · ")}
                    </td>
                    <td className="px-4 py-2.5 text-right font-display font-bold tabular-nums">
                      {formatPoints(s.points)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-silver">{s.wins}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-silver">{s.podiums}</td>
                    <td className="px-4 py-2.5">
                      <PointsSparkline points={s.last_five_points} color={s.constructor.color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </section>
  );
}

/** Tiny per-round points sparkline (bars), team-colored marks. */
function PointsSparkline({ points, color }: { points: number[]; color: string | null }) {
  const max = Math.max(...points, 1);
  return (
    <div className="flex h-6 items-end gap-0.5" title={points.map((p) => `${p} pts`).join(" · ")}>
      {points.map((p, i) => (
        <span
          key={i}
          className="w-2 rounded-t-[2px]"
          style={{
            height: `${Math.max((p / max) * 100, 8)}%`,
            background: color ?? "#3d3d3d",
            opacity: 0.4 + 0.6 * (i / Math.max(points.length - 1, 1)),
          }}
        />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}
