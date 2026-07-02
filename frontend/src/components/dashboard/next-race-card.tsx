"use client";

import { format } from "date-fns";
import { ArrowUpRight, MapPin, Ruler, Timer, Wind } from "lucide-react";
import Link from "next/link";

import { Countdown } from "@/components/f1/countdown";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useNextRace } from "@/lib/api/hooks";
import { countryFlag } from "@/lib/utils";

export function NextRaceCard() {
  const { data: race, isLoading } = useNextRace();

  return (
    <section>
      <SectionHeading title="Next Grand Prix" subtitle="Race weekend at a glance" />
      <GlassCard className="glass-hover overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24" />
          </div>
        ) : !race ? (
          <p className="p-6 text-sm text-muted">Season complete — no upcoming race.</p>
        ) : (
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-f1-red">
                Round {race.round} · {race.season}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                {countryFlag(race.circuit.country)} {race.name}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-3.5 w-3.5" />
                {race.circuit.name} · {race.circuit.location}, {race.circuit.country}
              </p>

              <div className="mt-4">
                <Countdown date={race.date} time={race.time} />
                <p className="mt-2 text-xs text-muted">
                  Lights out {format(new Date(race.date), "EEEE d MMMM yyyy")}
                  {race.time ? ` · ${race.time.slice(0, 5)} UTC` : ""}
                </p>
              </div>

              {/* circuit stats */}
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-white/8 bg-black/25 p-3">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
                    <Ruler className="h-3 w-3" /> Length
                  </p>
                  <p className="mt-1 font-display font-bold">
                    {race.circuit.length_km ? `${race.circuit.length_km} km` : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/25 p-3">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
                    <Timer className="h-3 w-3" /> Corners
                  </p>
                  <p className="mt-1 font-display font-bold">{race.circuit.corners ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/25 p-3">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
                    <Wind className="h-3 w-3" /> DRS zones
                  </p>
                  <p className="mt-1 font-display font-bold">{race.circuit.drs_zones ?? "—"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-1 text-sm">
                {race.previous_winner && (
                  <p className="text-silver">
                    <span className="text-muted">Previous winner here:</span>{" "}
                    <span className="font-semibold">{race.previous_winner}</span>
                  </p>
                )}
                {race.previous_pole && (
                  <p className="text-silver">
                    <span className="text-muted">Previous pole:</span>{" "}
                    <span className="font-semibold">{race.previous_pole}</span>
                  </p>
                )}
                {race.previous_fastest_lap && (
                  <p className="text-silver">
                    <span className="text-muted">Previous fastest lap:</span>{" "}
                    <span className="font-semibold">{race.previous_fastest_lap}</span>
                  </p>
                )}
              </div>

              <Link
                href={`/circuits/${race.circuit.circuit_ref}`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent transition hover:text-white"
              >
                View circuit analysis <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* weekend schedule */}
            <div className="border-t border-white/8 bg-black/25 p-6 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Weekend schedule
              </p>
              <ul className="mt-3 space-y-2.5">
                {race.schedule.map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between rounded-lg border border-white/6 px-3 py-2 text-sm"
                  >
                    <span className="text-silver">{s.name}</span>
                    <span className="tabular-nums text-muted">
                      {s.starts_at ? format(new Date(s.starts_at + "Z"), "EEE d MMM · HH:mm") : "TBC"}
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between rounded-lg border border-f1-red/40 bg-f1-red/10 px-3 py-2 text-sm">
                  <span className="font-semibold">Grand Prix</span>
                  <span className="tabular-nums text-silver">
                    {format(new Date(race.date), "EEE d MMM")}
                    {race.time ? ` · ${race.time.slice(0, 5)}` : ""}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </GlassCard>
    </section>
  );
}
