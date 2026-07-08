"use client";

import { motion } from "framer-motion";
import { ChevronRight, Crown, Shield } from "lucide-react";
import Link from "next/link";

import { Countdown } from "@/components/f1/countdown";
import { DriverAvatar } from "@/components/f1/driver-avatar";
import { TeamBadge } from "@/components/f1/team-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConstructorStandings,
  useDriverStandings,
  useSeasonProgress,
} from "@/lib/api/hooks";
import { HERO_IMAGE } from "@/lib/design/images";
import { formatPoints } from "@/lib/utils";

export function Hero() {
  const { data, isLoading } = useSeasonProgress();
  // shared react-query caches with the standings section — no extra endpoints
  const drivers = useDriverStandings();
  const constructors = useConstructorStandings();

  if (isLoading) {
    return (
      <div className="glass p-6 sm:p-10">
        <Skeleton className="h-14 w-3/4 max-w-xl" />
        <Skeleton className="mt-3 h-14 w-1/2 max-w-md" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const pct = data.total_rounds
    ? Math.round((data.completed_rounds / data.total_rounds) * 100)
    : 0;
  const gridFacts = [
    data.total_rounds ? `${data.total_rounds} Races` : null,
    constructors.data?.length ? `${constructors.data.length} Teams` : null,
    drivers.data?.length ? `${drivers.data.length} Drivers` : null,
    "1 Champion",
  ].filter(Boolean);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-card rounded-tr-none border border-white/8 bg-carbon-800"
    >
      {/* cinematic race photography, fading into the card */}
      <div className="absolute inset-y-0 right-0 w-[78%] sm:w-[62%]" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover object-[70%_center]"
          style={{
            maskImage: "linear-gradient(270deg, rgba(0,0,0,0.95) 38%, transparent 94%)",
            WebkitMaskImage: "linear-gradient(270deg, rgba(0,0,0,0.95) 38%, transparent 94%)",
          }}
        />
        {/* deep cinematic grade so the headline always reads */}
        <div className="absolute inset-0 bg-gradient-to-r from-carbon-800 via-carbon-800/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
      </div>
      {/* subtle diagonal racing-stripe overlay */}
      <div className="f1-hatch pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      {/* red racing line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-f1-red via-f1-red/40 to-transparent"
        aria-hidden
      />

      <div className="relative p-6 sm:p-10 lg:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-f1-red">
          {data.season} Formula 1 Season
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl font-bold uppercase italic leading-[0.9] tracking-tight sm:text-7xl lg:text-[72px]">
          The Pinnacle
          <br />
          of Motorsport
        </h1>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.15em] text-silver">
          {gridFacts.join("  ·  ")}
        </p>

        {/* season progress */}
        <div className="mt-6 max-w-md">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
            <span>
              Round {data.completed_rounds} of {data.total_rounds}
            </span>
            <span className="font-numeric text-sm text-silver">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-f1-red"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>

        {/* CTAs — same destinations as before */}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/compare" className="btn btn-primary group text-sm">
            Compare Drivers
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/predictor" className="btn btn-secondary text-sm">
            AI Race Predictor
          </Link>
          <Link href="/circuits" className="btn btn-secondary text-sm">
            Explore Circuits
          </Link>
        </div>

        {/* live season chips */}
        <div className="mt-9 grid gap-3 lg:grid-cols-3">
          {data.leader && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <Crown className="h-3.5 w-3.5 text-warning" /> Championship leader
                </div>
                <p className="mt-2 font-display text-xl font-bold leading-tight">
                  {data.leader.driver.full_name}
                </p>
                <p className="mt-0.5 text-sm text-silver">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                    style={{ background: data.leader.constructor?.color ?? "#3d3d3d" }}
                  />
                  {data.leader.constructor?.name} ·{" "}
                  <span className="tabular-nums">{formatPoints(data.leader.points)} pts</span> ·{" "}
                  {data.leader.wins} wins
                </p>
              </div>
              <DriverAvatar
                driver={data.leader.driver}
                teamColor={data.leader.constructor?.color}
                size="lg"
                className="rounded-xl"
              />
            </div>
          )}

          {data.leading_constructor && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <Shield className="h-3.5 w-3.5 text-accent" /> Leading constructor
                </div>
                <p className="mt-2 font-display text-xl font-bold leading-tight">
                  {data.leading_constructor.constructor.name}
                </p>
                <p className="mt-0.5 text-sm text-silver">
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
              <TeamBadge constructor={data.leading_constructor.constructor} />
            </div>
          )}

          {data.next_race && (
            <div className="rounded-xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Next · {data.next_race.name}
              </p>
              <div className="mt-2.5">
                <Countdown date={data.next_race.date} time={data.next_race.time} />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
