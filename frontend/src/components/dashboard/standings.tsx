"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { LastFiveChips } from "@/components/f1/last-five-chips";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructorStandings, useDriverStandings } from "@/lib/api/hooks";
import { cn, formatPoints, nationalityFlag } from "@/lib/utils";
import type { Constructor, DriverStanding } from "@/types/f1";

type Tab = "drivers" | "constructors";

/** Team identity chip: real logo on a light plate, else the team-colour mark. */
function TeamMark({ constructor: c }: { constructor: Constructor | null }) {
  if (c?.logo_url) {
    return (
      <span className="mr-2.5 inline-flex h-6 w-12 items-center justify-center overflow-hidden rounded bg-white/90 px-1 align-middle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.logo_url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      className="mr-2.5 inline-block h-2.5 w-2.5 rounded-sm align-middle"
      style={{ background: c?.color ?? "#3d3d3d" }}
    />
  );
}

export function Standings() {
  const [tab, setTab] = useState<Tab>("drivers");
  const [expanded, setExpanded] = useState(false);
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

      {tab === "drivers" ? (
        drivers.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : expanded ? (
          <>
            <GlassCard className="overflow-hidden">
              <DriversTable standings={drivers.data ?? []} />
            </GlassCard>
            <ExpandButton
              label="Show Top 3"
              icon={<ChevronUp className="h-4 w-4" />}
              onClick={() => setExpanded(false)}
            />
          </>
        ) : (
          <>
            {/* top three, editorial photo tiles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {drivers.data?.slice(0, 3).map((s, i) => (
                <motion.div
                  key={s.driver.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
                >
                  <DriverTile standing={s} />
                </motion.div>
              ))}
            </div>
            <ExpandButton
              label="View Full Standings"
              icon={<ChevronDown className="h-4 w-4" />}
              onClick={() => setExpanded(true)}
            />
          </>
        )
      ) : constructors.isLoading ? (
        <GlassCard className="overflow-hidden">
          <TableSkeleton />
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
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
                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "font-display text-lg font-bold tabular-nums",
                          s.position === 1 ? "text-f1-red" : s.position <= 3 ? "text-foreground" : "text-silver",
                        )}
                      >
                        {s.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TeamMark constructor={s.constructor} />
                      <span className="font-semibold">{s.constructor.name}</span>
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {s.drivers.map((d) => d.code ?? d.full_name.split(" ").at(-1)).join(" · ")}
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base font-bold tabular-nums">
                      {formatPoints(s.points)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-silver">{s.wins}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-silver">{s.podiums}</td>
                    <td className="px-4 py-3">
                      <PointsSparkline points={s.last_five_points} color={s.constructor.color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </section>
  );
}

/** Big editorial photo tile for a top-5 driver; links to their analytics page. */
function DriverTile({ standing: s }: { standing: DriverStanding }) {
  const color = s.constructor?.color ?? "#3d3d3d";
  return (
    <Link href={`/drivers/${s.driver.driver_ref}`} className="group block">
      <div className="glass glass-hover relative h-80 overflow-hidden rounded-card sm:h-[22rem]">
        {/* the photo IS the tile */}
        {s.driver.headshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.driver.headshot_url}
            alt={s.driver.full_name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
            style={{
              maskImage: "linear-gradient(180deg, black 58%, transparent 96%)",
              WebkitMaskImage: "linear-gradient(180deg, black 58%, transparent 96%)",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DriverAvatar driver={s.driver} teamColor={color} size="lg" />
          </div>
        )}

        {/* team-colour top bar + soft glow */}
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-25"
          style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
          aria-hidden
        />

        {/* position numeral */}
        <span
          className={cn(
            "absolute left-3 top-2 font-display text-4xl font-bold italic leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]",
            s.position === 1 ? "text-f1-red" : "text-white/90",
          )}
        >
          {s.position}
        </span>

        {/* info panel */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-3 pt-12">
          <p className="truncate font-display text-sm font-bold sm:text-base">
            {nationalityFlag(s.driver.nationality)} {s.driver.full_name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-silver">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle"
              style={{ background: color }}
            />
            {s.constructor?.name ?? "—"}
          </p>
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <LastFiveChips results={s.last_five} />
            <div className="shrink-0 text-right">
              <p className="font-display text-xl font-bold leading-none tabular-nums">
                {formatPoints(s.points)}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-muted">pts</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** The full drivers table (all rows) shown when expanded. */
function DriversTable({ standings }: { standings: DriverStanding[] }) {
  return (
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
          {standings.map((s) => (
            <tr
              key={s.driver.id}
              className="group border-b border-white/4 transition-colors last:border-0 hover:bg-white/[0.04]"
            >
              <td className="relative px-4 py-3">
                <span
                  className="absolute inset-y-1 left-0 w-[3px] rounded-r opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: s.constructor?.color ?? "#3d3d3d" }}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-display text-lg font-bold tabular-nums",
                    s.position === 1 ? "text-f1-red" : s.position <= 3 ? "text-foreground" : "text-silver",
                  )}
                >
                  {s.position}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <DriverAvatar driver={s.driver} teamColor={s.constructor?.color} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {nationalityFlag(s.driver.nationality)} {s.driver.full_name}
                    </p>
                    <p className="text-[11px] text-muted">#{s.driver.number ?? "—"}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TeamMark constructor={s.constructor} />
                <span className="text-silver">{s.constructor?.name ?? "—"}</span>
              </td>
              <td className="px-4 py-3 text-right font-display text-base font-bold tabular-nums">
                {formatPoints(s.points)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-silver">{s.wins}</td>
              <td className="px-4 py-3 text-right tabular-nums text-silver">{s.podiums}</td>
              <td className="px-4 py-3">
                <LastFiveChips results={s.last_five} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpandButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-silver transition hover:border-f1-red/50 hover:bg-f1-red/5 hover:text-white"
    >
      {label} {icon}
    </button>
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
