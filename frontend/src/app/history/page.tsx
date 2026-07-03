"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonRaces, useSeasons } from "@/lib/api/hooks";
import { CIRCUIT_IMAGES } from "@/lib/design/images";
import { countryFlag } from "@/lib/utils";
import type { CalendarRace } from "@/types/f1";

export default function HistoryPage() {
  const { data: seasons } = useSeasons();
  const [season, setSeason] = useState<number | undefined>(undefined);
  const active = season ?? seasons?.[0];
  const { data: races, isLoading } = useSeasonRaces(active);

  const completed = races?.filter((r) => r.completed) ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        title="Race Explorer"
        subtitle="Browse every Grand Prix result in the ingested history"
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : completed.length === 0 ? (
        <GlassCard className="py-16 text-center text-sm text-muted">
          No completed races ingested for {active} yet.
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {completed.map((race, i) => (
            <RaceCard key={race.race_id} race={race} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function RaceCard({ race, index }: { race: CalendarRace; index: number }) {
  const art = CIRCUIT_IMAGES[race.circuit.circuit_ref];
  const date = new Date(race.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
    >
      <Link href={`/history/${race.race_id}`} className="group block">
        <GlassCard hover className="relative h-40 overflow-hidden p-4">
          {art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={art}
              alt=""
              aria-hidden
              loading="lazy"
              className="pointer-events-none absolute -bottom-6 -right-4 h-[100%] max-w-none opacity-[0.12] transition duration-500 group-hover:opacity-20"
              style={{
                filter: "invert(1) grayscale(1)",
                maskImage: "linear-gradient(250deg, black 40%, transparent 88%)",
                WebkitMaskImage: "linear-gradient(250deg, black 40%, transparent 88%)",
              }}
            />
          )}
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Round {race.round}
              </span>
              <span className="text-[10px] text-muted">{date}</span>
            </div>
            <p className="mt-1 font-display text-lg font-bold leading-tight">
              {countryFlag(race.circuit.country)} {race.name}
            </p>
            <div className="mt-auto border-t border-white/5 pt-2.5">
              {race.winner ? (
                <p className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-warning" />
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: race.winner_color ?? "#3d3d3d" }}
                  />
                  <span className="font-semibold">{race.winner}</span>
                </p>
              ) : (
                <p className="text-xs text-muted">Result pending</p>
              )}
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
