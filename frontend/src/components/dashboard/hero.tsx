"use client";

import { motion } from "framer-motion";
import { ChevronRight, Crown, Shield } from "lucide-react";
import Link from "next/link";

import { Countdown } from "@/components/f1/countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonProgress } from "@/lib/api/hooks";
import { formatPoints } from "@/lib/utils";

export function Hero() {
  const { data, isLoading } = useSeasonProgress();

  if (isLoading) {
    return (
      <div className="glass rounded-card p-6 sm:p-8">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const pct = data.total_rounds
    ? Math.round((data.completed_rounds / data.total_rounds) * 100)
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass relative overflow-hidden rounded-card p-6 sm:p-8"
    >
      {/* red glow + speed lines backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-f1-red/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-f1-red/60 via-white/10 to-transparent" />
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-[0.06]"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${-50 + i * 30} 220 L ${180 + i * 30} -20`}
              stroke="white"
              strokeWidth="14"
            />
          ))}
        </svg>
      </div>

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-f1-red">
          Formula 1 · {data.season} Season
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Race Command Center
        </h1>

        {/* season progress */}
        <div className="mt-5 max-w-xl">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Round {data.completed_rounds} of {data.total_rounds}
            </span>
            <span className="tabular-nums">{pct}% complete</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-f1-red to-f1-red-bright"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* championship leader */}
          {data.leader && (
            <div className="rounded-xl border border-white/8 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
                <Crown className="h-3.5 w-3.5 text-warning" /> Championship leader
              </div>
              <p className="mt-2 font-display text-xl font-bold">
                {data.leader.driver.full_name}
              </p>
              <p className="text-sm text-silver">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                  style={{ background: data.leader.constructor?.color ?? "#3d3d3d" }}
                />
                {data.leader.constructor?.name} ·{" "}
                <span className="tabular-nums">{formatPoints(data.leader.points)} pts</span> ·{" "}
                {data.leader.wins} wins
              </p>
            </div>
          )}

          {/* leading constructor */}
          {data.leading_constructor && (
            <div className="rounded-xl border border-white/8 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
                <Shield className="h-3.5 w-3.5 text-accent" /> Leading constructor
              </div>
              <p className="mt-2 font-display text-xl font-bold">
                {data.leading_constructor.constructor.name}
              </p>
              <p className="text-sm text-silver">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                  style={{ background: data.leading_constructor.constructor.color ?? "#3d3d3d" }}
                />
                <span className="tabular-nums">
                  {formatPoints(data.leading_constructor.points)} pts
                </span>{" "}
                · {data.leading_constructor.wins} wins
              </p>
            </div>
          )}

          {/* next race countdown */}
          {data.next_race && (
            <div className="rounded-xl border border-white/8 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-widest text-muted">
                Next · {data.next_race.name}
              </p>
              <div className="mt-2">
                <Countdown date={data.next_race.date} time={data.next_race.time} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/compare"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-f1-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-f1-red-bright"
          >
            Compare Drivers
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/predictor"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-silver transition hover:border-white/30 hover:text-white"
          >
            AI Race Predictor
          </Link>
          <Link
            href="/circuits"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-silver transition hover:border-white/30 hover:text-white"
          >
            Explore Circuits
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
