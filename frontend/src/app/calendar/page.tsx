"use client";

import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonRaces, useSeasons } from "@/lib/api/hooks";
import { cn, countryFlag } from "@/lib/utils";
import type { CalendarRace } from "@/types/f1";

export default function CalendarPage() {
  const { data: seasons } = useSeasons();
  const [season, setSeason] = useState<number | undefined>(undefined);
  const active = season ?? seasons?.[0];
  const { data: races, isLoading } = useSeasonRaces(active);

  const nextIdx = races?.findIndex((r) => !r.completed) ?? -1;

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading
        title="Race Calendar"
        subtitle={active ? `${active} Formula 1 World Championship` : "Season schedule"}
        action={
          <select
            value={active ?? ""}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-carbon-800 px-3 py-1.5 text-sm font-semibold text-foreground focus:border-f1-red/50 focus:outline-none"
          >
            {seasons?.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        }
      />

      {isLoading || !races ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="relative space-y-3 before:absolute before:bottom-4 before:left-[27px] before:top-4 before:w-px before:bg-white/8">
          {races.map((race, i) => (
            <RaceRow key={race.race_id} race={race} isNext={i === nextIdx} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function RaceRow({ race, isNext, index }: { race: CalendarRace; isNext: boolean; index: number }) {
  const date = new Date(race.date);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
  const month = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();

  const inner = (
    <GlassCard
      hover={race.completed}
      className={cn(
        "relative flex items-center gap-4 p-4",
        isNext && "ring-1 ring-f1-red/40",
      )}
    >
      {/* round marker on the timeline */}
      <div
        className={cn(
          "z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border",
          race.completed
            ? "border-white/10 bg-black/40"
            : isNext
              ? "border-f1-red/50 bg-f1-red/10"
              : "border-white/10 bg-black/20",
        )}
      >
        <span className="font-display text-lg font-bold leading-none tabular-nums">{day}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted">{month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Round {race.round}
          </span>
          {isNext && (
            <span className="rounded-full bg-f1-red/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-f1-red">
              Up Next
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-display text-base font-bold">
          {countryFlag(race.circuit.country)} {race.name}
        </p>
        <p className="truncate text-xs text-muted">{race.circuit.name}</p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        {race.completed && race.winner ? (
          <>
            <p className="flex items-center justify-end gap-1.5 text-sm font-semibold">
              <Trophy className="h-3.5 w-3.5 text-warning" /> {race.winner}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted">Winner</p>
          </>
        ) : (
          <span className="text-xs italic text-muted">
            {date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
      </div>
      {race.completed && <ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
    </GlassCard>
  );

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      className="relative pl-0"
    >
      {inner}
    </motion.div>
  );

  return race.completed ? (
    <Link href={`/history/${race.race_id}`} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
