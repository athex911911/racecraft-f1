"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Gauge, Timer, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRaceDetail } from "@/lib/api/hooks";
import { CIRCUIT_IMAGES } from "@/lib/design/images";
import { cn, countryFlag, formatPoints } from "@/lib/utils";
import type { RaceResultRow } from "@/types/f1";

export default function RaceDetailPage() {
  const params = useParams<{ raceId: string }>();
  const raceId = Number(params.raceId);
  const { data, isLoading, isError } = useRaceDetail(raceId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-semibold">Race not found</p>
        <Link href="/history" className="mt-6 inline-block text-sm text-f1-red hover:underline">
          ← Back to history
        </Link>
      </div>
    );
  }

  const art = CIRCUIT_IMAGES[data.circuit.circuit_ref];
  const dateStr = new Date(data.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> History
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          {art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={art}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-8 top-1/2 h-[135%] max-w-none -translate-y-1/2 opacity-[0.10]"
              style={{
                filter: "invert(1) grayscale(1)",
                maskImage: "linear-gradient(260deg, black 35%, transparent 85%)",
                WebkitMaskImage: "linear-gradient(260deg, black 35%, transparent 85%)",
              }}
            />
          )}
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-f1-red">
              Round {data.round} · {data.season}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {countryFlag(data.circuit.country)} {data.name}
            </h1>
            <p className="mt-2 text-sm text-silver">
              {data.circuit.name} · {dateStr}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {data.pole_sitter && (
                <Chip icon={<Gauge className="h-3.5 w-3.5 text-accent" />} label="Pole" value={data.pole_sitter} />
              )}
              {data.fastest_lap_driver && (
                <Chip icon={<Zap className="h-3.5 w-3.5 text-warning" />} label="Fastest lap" value={data.fastest_lap_driver} />
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Pos</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 text-right font-medium">Grid</th>
                <th className="px-4 py-3 text-right font-medium">Pts</th>
                <th className="px-4 py-3 font-medium">Time / Status</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <ResultRow key={r.driver.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-silver backdrop-blur">
      {icon}
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

function ResultRow({ row: r }: { row: RaceResultRow }) {
  const finished = r.position_text != null && /^\d+$/.test(r.position_text);
  const pos = finished ? Number(r.position_text) : null;
  const gained = r.grid != null && pos != null ? r.grid - pos : null;

  return (
    <tr className="border-b border-white/4 transition-colors last:border-0 hover:bg-white/[0.04]">
      <td className="px-4 py-2.5">
        <span
          className={cn(
            "font-display text-base font-bold tabular-nums",
            pos === 1 ? "text-f1-red" : pos != null && pos <= 3 ? "text-foreground" : "text-silver",
            !finished && "text-danger",
          )}
        >
          {finished ? pos : r.position_text ?? "—"}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <Link
          href={`/drivers/${r.driver.driver_ref}`}
          className="flex items-center gap-2.5 hover:text-white"
        >
          <DriverAvatar driver={r.driver} teamColor={r.constructor?.color} size="sm" />
          <span className="font-semibold">
            {r.driver.full_name}
            {r.fastest_lap && <Zap className="ml-1.5 inline h-3 w-3 text-warning" />}
          </span>
        </Link>
      </td>
      <td className="px-4 py-2.5">
        <span
          className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
          style={{ background: r.constructor?.color ?? "#3d3d3d" }}
        />
        <span className="text-silver">{r.constructor?.name ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-silver">
        {r.grid ?? "—"}
        {gained != null && gained !== 0 && (
          <span className={cn("ml-1.5 text-[11px]", gained > 0 ? "text-success" : "text-danger")}>
            {gained > 0 ? `▲${gained}` : `▼${-gained}`}
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
        {r.points ? formatPoints(r.points) : "—"}
      </td>
      <td className="px-4 py-2.5 text-muted">
        {r.time_text ? (
          <span className="inline-flex items-center gap-1.5 text-silver">
            <Timer className="h-3 w-3" /> {r.time_text}
          </span>
        ) : (
          r.status ?? "—"
        )}
      </td>
    </tr>
  );
}
