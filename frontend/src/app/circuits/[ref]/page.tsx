"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, ChevronDown, Timer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { CircuitHologram } from "@/components/circuits/circuit-hologram";
import { DriverAvatar } from "@/components/f1/driver-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { useCircuitDetail } from "@/lib/api/hooks";
import { CIRCUIT_IMAGES, CIRCUIT_PHOTOS } from "@/lib/design/images";
import { cn, countryFlag } from "@/lib/utils";
import type { CircuitWinnerLine, TopEntry } from "@/types/f1";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function CircuitDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const { data, isLoading, isError } = useCircuitDetail(ref);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-semibold">Circuit not found</p>
        <p className="mt-2 text-sm text-muted">We couldn&apos;t find a circuit called “{ref}”.</p>
        <Link href="/circuits" className="mt-6 inline-block text-sm text-f1-red hover:underline">
          ← Back to circuits
        </Link>
      </div>
    );
  }

  const { circuit: c } = data;
  const art = CIRCUIT_IMAGES[c.circuit_ref];
  const photo = CIRCUIT_PHOTOS[c.circuit_ref];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        href="/circuits"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Circuits
      </Link>

      {/* header with the track layout as the centrepiece */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="relative min-h-[300px] overflow-hidden rounded-card rounded-tr-none border border-white/8 sm:min-h-[360px]">
          {/* full-bleed real photo of the track */}
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-carbon-850" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-carbon-900 via-carbon-900/55 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-carbon-900/80 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-f1-red via-f1-red/40 to-transparent" />

          {/* track-layout inset — the shape, over the photo */}
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={art}
              alt={`${c.name} layout`}
              className="pointer-events-none absolute right-5 top-5 hidden h-24 w-24 object-contain opacity-70 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:block"
              style={{ filter: "invert(1) grayscale(1)" }}
            />
          ) : null}

          <div className="absolute inset-x-0 bottom-0 max-w-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-f1-red drop-shadow">
                {c.track_type ? `${c.track_type} circuit` : "Circuit"}
              </p>
              {data.on_current_calendar ? (
                <span className="rounded-full bg-f1-red/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-f1-red ring-1 ring-f1-red/40 backdrop-blur">
                  2026 Calendar
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-5xl">
              {countryFlag(c.country)} {c.name}
            </h1>
            <p className="mt-2 text-sm text-silver drop-shadow">
              {[c.location, c.country].filter(Boolean).join(" · ")}
              {c.first_gp_year ? ` · First Grand Prix ${c.first_gp_year}` : ""}
            </p>
            {data.next_race_date ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-silver backdrop-blur">
                <CalendarDays className="h-3.5 w-3.5 text-f1-red" />
                Lights out{" "}
                {new Date(data.next_race_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* track + history KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Length" value={c.length_km ? `${c.length_km}` : "—"} sub={c.length_km ? "km" : undefined} />
        <StatTile label="Corners" value={c.corners ?? "—"} />
        <StatTile label="DRS Zones" value={c.drs_zones ?? "—"} />
        <StatTile
          label="Lap Record"
          value={c.lap_record_time ?? "—"}
          sub={c.lap_record_driver ? `${c.lap_record_driver}${c.lap_record_year ? ` · ${c.lap_record_year}` : ""}` : undefined}
          accent
        />
        <StatTile
          label="GPs Held"
          value={data.races_held}
          sub={data.first_year ? `since ${data.first_year}` : undefined}
        />
        <StatTile label="Different Winners" value={data.distinct_winners} />
      </div>

      {/* race character from history */}
      <Reveal>
        <SectionHeading title="Race Character" subtitle="Computed from every ingested race here" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Pole → Win"
            value={data.pole_win_rate != null ? `${Math.round(data.pole_win_rate * 100)}%` : "—"}
            sub="races won from pole"
          />
          <StatTile
            label="Attrition"
            value={data.dnf_rate != null ? `${Math.round(data.dnf_rate * 100)}%` : "—"}
            sub="of cars retire"
          />
          <StatTile
            label="Avg Finishers"
            value={data.avg_finishers != null ? data.avg_finishers.toFixed(1) : "—"}
            sub="classified per race"
          />
        </div>
      </Reveal>

      {/* holographic racing lines */}
      <Reveal>
        <SectionHeading
          title="Racing Lines"
          subtitle="Holographic top-down — fastest, optimal and slowest lines through the lap"
        />
        <CircuitHologram circuitRef={c.circuit_ref} corners={c.corners} />
      </Reveal>

      {/* most successful here */}
      {data.races_held > 0 ? (
        <Reveal>
          <SectionHeading title="Masters of This Track" subtitle="Most wins in the ingested era" />
          <div className="grid gap-6 lg:grid-cols-2">
            <TopList title="Drivers" entries={data.top_drivers} />
            <TopList title="Constructors" entries={data.top_constructors} />
          </div>
        </Reveal>
      ) : null}

      {/* winners table */}
      <Reveal>
        <SectionHeading title="Race Winners" subtitle="Every ingested Grand Prix at this circuit" />
        <GlassCard className="overflow-hidden">
          <WinnersTable winners={data.winners} />
        </GlassCard>
      </Reveal>

      {data.data_since ? (
        <p className="pb-2 text-center text-[11px] text-muted">
          History covers ingested seasons from {data.data_since} onward.
        </p>
      ) : null}
    </div>
  );
}

/** Horizontal win-count bars; team colour marks identity, label + value always visible.
 *  Shows the top 3 by default with a "show more" toggle for the rest. */
function TopList({ title, entries }: { title: string; entries: TopEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(...entries.map((e) => e.value), 1);
  const visible = expanded ? entries : entries.slice(0, 3);
  const hidden = entries.length - 3;

  return (
    <GlassCard className="p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">{title}</p>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No races here yet.</p>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((e, i) => (
              <div key={e.label} className="flex items-center gap-3">
                <span className="w-4 text-right font-display text-sm font-bold tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="w-32 truncate text-sm text-silver">{e.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-white/5">
                  <motion.div
                    className="h-full rounded"
                    style={{ background: e.color ?? "#8a8a8a" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(e.value / max) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="w-8 text-right font-display text-sm font-bold tabular-nums">
                  {e.value}
                </span>
              </div>
            ))}
          </div>
          {hidden > 0 ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-silver transition hover:border-f1-red/50 hover:bg-f1-red/5 hover:text-white"
            >
              {expanded ? "Show less" : `Show ${hidden} more`}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
            </button>
          ) : null}
        </>
      )}
    </GlassCard>
  );
}

function WinnersTable({ winners }: { winners: CircuitWinnerLine[] }) {
  if (winners.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No completed races here yet — this circuit debuts in the current season.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-medium">Season</th>
            <th className="px-4 py-3 font-medium">Winner</th>
            <th className="px-4 py-3 font-medium">Team</th>
            <th className="px-4 py-3 text-right font-medium">From Grid</th>
            <th className="px-4 py-3 text-right font-medium">Race Time</th>
          </tr>
        </thead>
        <tbody>
          {winners.map((w) => (
            <tr
              key={`${w.season}-${w.race_name}`}
              className="border-b border-white/4 transition-colors last:border-0 hover:bg-white/[0.04]"
            >
              <td className="px-4 py-2.5 font-display font-bold tabular-nums">{w.season}</td>
              <td className="px-4 py-2.5">
                <Link
                  href={`/drivers/${w.driver.driver_ref}`}
                  className="flex items-center gap-2.5 hover:text-white"
                >
                  <DriverAvatar driver={w.driver} teamColor={w.constructor?.color} size="sm" />
                  <span className="font-semibold">{w.driver.full_name}</span>
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                  style={{ background: w.constructor?.color ?? "#3d3d3d" }}
                />
                <span className="text-silver">{w.constructor?.name ?? "—"}</span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span
                  className={cn(
                    "font-display font-bold tabular-nums",
                    w.grid === 1 && "text-f1-red",
                  )}
                >
                  {w.grid ? `P${w.grid}` : "—"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-silver">
                {w.time_text ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Timer className="h-3 w-3 text-muted" /> {w.time_text}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-44" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[280px]" />
        <Skeleton className="h-[280px]" />
      </div>
    </div>
  );
}
