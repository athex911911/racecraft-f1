"use client";

import { ArrowLeft, Minus, ThumbsDown, ThumbsUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { RatingsRadar } from "@/components/drivers/ratings-radar";
import { SeasonPointsChart } from "@/components/drivers/season-points-chart";
import { DriverAvatar } from "@/components/f1/driver-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { useDriverDetail } from "@/lib/api/hooks";
import { cn, formatPoints, nationalityFlag, ordinal } from "@/lib/utils";
import type { DriverResultLine, DriverSeasonStat } from "@/types/f1";

export default function DriverDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const { data, isLoading, isError } = useDriverDetail(ref);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-semibold">Driver not found</p>
        <p className="mt-2 text-sm text-muted">
          We couldn&apos;t find a driver called “{ref}”.
        </p>
        <Link href="/drivers" className="mt-6 inline-block text-sm text-f1-red hover:underline">
          ← Back to drivers
        </Link>
      </div>
    );
  }

  const { driver, career, current_constructor, teams } = data;
  const teamColor = current_constructor?.color ?? "#3d3d3d";
  const age = ageFrom(data.dob);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        href="/drivers"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Drivers
      </Link>

      {/* header */}
      <GlassCard className="relative overflow-hidden p-6">
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: teamColor }} aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: teamColor }}
          aria-hidden
        />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <DriverAvatar driver={driver} teamColor={teamColor} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {nationalityFlag(driver.nationality)} {driver.full_name}
              </h1>
              {driver.number ? (
                <span className="rounded-md border border-white/10 px-2 py-0.5 font-display text-sm font-bold tabular-nums text-silver">
                  #{driver.number}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-silver">
              {current_constructor?.name ?? "—"}
              {driver.nationality ? ` · ${driver.nationality}` : ""}
              {age !== null ? ` · ${age} yrs` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">
              {career.first_season}–{career.last_season} · {career.seasons} seasons
              {teams.length > 1 ? ` · ${teams.map((t) => t.name).join(", ")}` : ""}
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
                  World Champion
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </GlassCard>

      {/* career stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Wins" value={career.wins} accent sub={`${(career.win_rate * 100).toFixed(0)}% of races`} />
        <StatTile label="Podiums" value={career.podiums} sub={`${(career.podium_rate * 100).toFixed(0)}% of races`} />
        <StatTile label="Poles" value={career.poles} />
        <StatTile label="Points" value={formatPoints(career.points)} />
        <StatTile label="Races" value={career.races} sub={`${career.dnfs} DNFs`} />
        <StatTile
          label="Best Finish"
          value={career.best_championship_position ? ordinal(career.best_championship_position) : "—"}
          sub="in a championship"
        />
      </div>

      {/* ratings + strengths */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeading title="Performance Profile" subtitle="Normalised 0–100 · computed from race data" />
          <GlassCard className="p-4 sm:p-6">
            <RatingsRadar ratings={data.ratings} />
          </GlassCard>
        </div>
        <div>
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
        </div>
      </section>

      {/* season progression */}
      <section>
        <SectionHeading title="Season by Season" subtitle="Points per campaign, tinted by team" />
        <GlassCard className="p-4 sm:p-6">
          <SeasonPointsChart seasons={data.seasons} />
          <SeasonTable seasons={[...data.seasons].reverse()} />
        </GlassCard>
      </section>

      {/* recent results */}
      <section>
        <SectionHeading title="Recent Results" subtitle="Latest ingested races" />
        <GlassCard className="overflow-hidden">
          <ResultsTable results={data.recent_results} />
        </GlassCard>
      </section>

      {data.data_since ? (
        <p className="pb-2 text-center text-[11px] text-muted">
          Career statistics cover ingested seasons from {data.data_since} onward.
        </p>
      ) : null}
    </div>
  );
}

function SeasonTable({ seasons }: { seasons: DriverSeasonStat[] }) {
  return (
    <div className="mt-4 overflow-x-auto border-t border-white/5 pt-4">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-muted">
            <th className="px-3 py-2 font-medium">Season</th>
            <th className="px-3 py-2 font-medium">Team</th>
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
              <td className="px-3 py-2">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                  style={{ background: s.constructor?.color ?? "#3d3d3d" }}
                />
                <span className="text-silver">{s.constructor?.name ?? "—"}</span>
              </td>
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

function ResultsTable({ results }: { results: DriverResultLine[] }) {
  if (results.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No results ingested.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-medium">Race</th>
            <th className="px-4 py-3 text-right font-medium">Grid</th>
            <th className="px-4 py-3 text-right font-medium">Finish</th>
            <th className="px-4 py-3 text-right font-medium">Pts</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const finished = r.position_text != null && /^\d+$/.test(r.position_text);
            return (
              <tr key={`${r.season}-${r.round}`} className="border-b border-white/4 last:border-0">
                <td className="px-4 py-2.5">
                  <span className="text-muted">{r.season}</span> {r.race_name}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-silver">{r.grid ?? "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={cn(
                      "font-display font-bold tabular-nums",
                      finished && Number(r.position_text) === 1 && "text-f1-red",
                      !finished && "text-danger",
                    )}
                  >
                    {finished ? `P${r.position_text}` : r.position_text ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatPoints(r.points)}</td>
                <td className="px-4 py-2.5 text-muted">{r.status ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Skeleton className="h-4 w-20" />
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

function ageFrom(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
