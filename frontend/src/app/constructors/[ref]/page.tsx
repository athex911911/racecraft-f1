"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Minus, ThumbsDown, ThumbsUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { RatingsRadar } from "@/components/drivers/ratings-radar";
import { SeasonPointsChart } from "@/components/drivers/season-points-chart";
import { DriverAvatar } from "@/components/f1/driver-avatar";
import { FavoriteButton } from "@/components/f1/favorite-button";
import { CountUp } from "@/components/ui/count-up";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { useConstructorDetail } from "@/lib/api/hooks";
import { cn, countryFlag, formatPoints, ordinal } from "@/lib/utils";
import type { ConstructorDriver, ConstructorResultLine, ConstructorSeasonStat } from "@/types/f1";

/** Logo-style monogram for teams without a real logo (Ferrari → FER, RB F1 Team → RB). */
function teamInitials(name: string): string {
  const filler = /^(f1|team|racing|formula|one|f\d)$/i;
  const words = name.split(/\s+/).filter((w) => !filler.test(w));
  const base = words.length ? words : name.split(/\s+/);
  return base.length === 1
    ? base[0].slice(0, 3).toUpperCase()
    : base.map((w) => w[0]).slice(0, 3).join("").toUpperCase();
}

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

export default function ConstructorDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const { data, isLoading, isError } = useConstructorDetail(ref);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-semibold">Constructor not found</p>
        <p className="mt-2 text-sm text-muted">We couldn&apos;t find a team called “{ref}”.</p>
        <Link href="/constructors" className="mt-6 inline-block text-sm text-f1-red hover:underline">
          ← Back to constructors
        </Link>
      </div>
    );
  }

  const { constructor: c, career } = data;
  const color = c.color ?? "#3d3d3d";
  const initials = teamInitials(c.name);
  const pointsDecimals = Number.isInteger(career.points) ? 0 : 1;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        href="/constructors"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Constructors
      </Link>

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <GlassCard className="relative overflow-hidden p-6">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden />
          <motion.div
            className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: color }}
            animate={{ opacity: [0.18, 0.3, 0.18] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{
                boxShadow: `0 0 0 2px ${color}`,
                background: c.logo_url ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${color}55, transparent)`,
              }}
            >
              {c.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logo_url} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <span className="font-display text-xl font-bold">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{c.name}</h1>
              <p className="mt-1.5 text-sm text-silver">
                {countryFlag(c.nationality)} {c.nationality ?? "—"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {career.first_season}–{career.last_season} · {career.seasons} seasons ·{" "}
                {career.races} races
              </p>
            </div>
            {career.titles > 0 ? (
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                <Trophy className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-display text-lg font-bold leading-none text-warning">
                    {career.titles}×
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-warning/80">
                    Constructors&apos; Title
                  </p>
                </div>
              </div>
            ) : career.best_championship_position ? (
              <div className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center">
                <p className="font-display text-lg font-bold leading-none text-silver">
                  {ordinal(career.best_championship_position)}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted">Best finish</p>
              </div>
            ) : null}
            <FavoriteButton kind="constructor" entityRef={c.constructor_ref} className="shrink-0" />
          </div>
        </GlassCard>
      </motion.div>

      {/* KPI tiles with animated counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Wins" accent value={<CountUp value={career.wins} />} sub={`${(career.win_rate * 100).toFixed(0)}% of races`} />
        <StatTile label="Podiums" value={<CountUp value={career.podiums} />} sub={`${career.one_twos} one-twos`} />
        <StatTile label="Poles" value={<CountUp value={career.poles} />} />
        <StatTile label="Points" value={<CountUp value={career.points} decimals={pointsDecimals} />} />
        <StatTile label="Races" value={<CountUp value={career.races} />} sub={`${career.dnfs} car DNFs`} />
        <StatTile label="Fastest Laps" value={<CountUp value={career.fastest_laps} />} />
      </div>

      {/* ratings + strengths */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <SectionHeading title="Team Profile" subtitle="Normalised 0–100 · computed from race data" />
          <GlassCard className="p-4 sm:p-6">
            <RatingsRadar ratings={data.ratings} />
          </GlassCard>
        </Reveal>
        <Reveal delay={0.1}>
          <SectionHeading title="Strengths & Weaknesses" subtitle="Auto-generated from the ratings" />
          <GlassCard className="space-y-4 p-5">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-success">
                <ThumbsUp className="h-3.5 w-3.5" /> Strengths
              </p>
              <ul className="space-y-2">
                {data.strengths.length ? (
                  data.strengths.map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-silver">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      {s}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted">Not enough data yet.</li>
                )}
              </ul>
            </div>
            <div className="border-t border-white/5 pt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-danger">
                <ThumbsDown className="h-3.5 w-3.5" /> Weaknesses
              </p>
              <ul className="space-y-2">
                {data.weaknesses.length ? (
                  data.weaknesses.map((w) => (
                    <li key={w} className="flex gap-2 text-sm text-silver">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                      {w}
                    </li>
                  ))
                ) : (
                  <li className="flex items-center gap-2 text-sm text-muted">
                    <Minus className="h-3.5 w-3.5" /> No notable weaknesses.
                  </li>
                )}
              </ul>
            </div>
          </GlassCard>
        </Reveal>
      </section>

      {/* season progression */}
      <Reveal>
        <SectionHeading title="Season by Season" subtitle="Points per campaign" />
        <GlassCard className="p-4 sm:p-6">
          <SeasonPointsChart seasons={data.seasons} />
          <SeasonTable seasons={[...data.seasons].reverse()} />
        </GlassCard>
      </Reveal>

      {/* driver line-up */}
      <Reveal>
        <SectionHeading title="Driver Line-up" subtitle="Every driver who has raced for the team" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.drivers.map((td, i) => (
            <LineupCard key={td.driver.id} td={td} color={color} index={i} />
          ))}
        </div>
      </Reveal>

      {/* recent results */}
      <Reveal>
        <SectionHeading title="Recent Results" subtitle="Latest ingested races" />
        <GlassCard className="overflow-hidden">
          <ResultsTable results={data.recent_results} color={color} />
        </GlassCard>
      </Reveal>

      {data.data_since ? (
        <p className="pb-2 text-center text-[11px] text-muted">
          Statistics cover ingested seasons from {data.data_since} onward.
        </p>
      ) : null}
    </div>
  );
}

function LineupCard({ td, color, index }: { td: ConstructorDriver; color: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link href={`/drivers/${td.driver.driver_ref}`} className="group block">
        <GlassCard hover className="flex items-center gap-3 p-3">
          <DriverAvatar driver={td.driver} teamColor={color} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{td.driver.full_name}</p>
            <p className="text-[11px] text-muted">
              {td.races} races · {td.seasons} {td.seasons === 1 ? "season" : "seasons"}
            </p>
          </div>
          {td.is_current ? (
            <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-success">
              Current
            </span>
          ) : null}
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SeasonTable({ seasons }: { seasons: ConstructorSeasonStat[] }) {
  return (
    <div className="mt-4 overflow-x-auto border-t border-white/5 pt-4">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-muted">
            <th className="px-3 py-2 font-medium">Season</th>
            <th className="px-3 py-2 text-right font-medium">Pts</th>
            <th className="px-3 py-2 text-right font-medium">Wins</th>
            <th className="px-3 py-2 text-right font-medium">Podiums</th>
            <th className="px-3 py-2 text-right font-medium">Poles</th>
            <th className="px-3 py-2 text-right font-medium">Champ</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((s) => (
            <tr key={s.season} className="border-t border-white/4">
              <td className="px-3 py-2 font-display font-bold tabular-nums">{s.season}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatPoints(s.points)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-silver">{s.wins}</td>
              <td className="px-3 py-2 text-right tabular-nums text-silver">{s.podiums}</td>
              <td className="px-3 py-2 text-right tabular-nums text-silver">{s.poles}</td>
              <td className="px-3 py-2 text-right tabular-nums text-silver">
                {s.championship_position ? `P${s.championship_position}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultsTable({ results, color }: { results: ConstructorResultLine[]; color: string }) {
  if (results.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No results ingested.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-medium">Race</th>
            <th className="px-4 py-3 font-medium">Cars</th>
            <th className="px-4 py-3 text-right font-medium">Best</th>
            <th className="px-4 py-3 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={`${r.season}-${r.round}`} className="border-b border-white/4 last:border-0">
              <td className="px-4 py-2.5">
                <span className="text-muted">{r.season}</span> {r.race_name}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {r.car_results.map((cr) => (
                    <span
                      key={cr}
                      className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] tabular-nums text-silver"
                    >
                      {cr}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span
                  className="font-display font-bold tabular-nums"
                  style={{ color: r.best_position === 1 ? color : undefined }}
                >
                  {r.best_position ? `P${r.best_position}` : "—"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                {formatPoints(r.points)}
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
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[360px]" />
      </div>
    </div>
  );
}
