"use client";

import { motion } from "framer-motion";
import { ChevronDown, Sparkles, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { DriverPhotoTile } from "@/components/f1/driver-photo-tile";
import { CountUp } from "@/components/ui/count-up";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { useChampionshipSim, usePredictRace, useSeasonRaces } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import type { RacePredictionEntry } from "@/types/f1";

const FALLBACK = "#BFBFBF";

const GRID_SOURCE_LABEL: Record<string, string> = {
  official: "Official grid",
  qualifying: "Qualifying order",
  estimated: "Grid estimated from recent form",
};

const pct = (v: number, decimals = 0) => `${(v * 100).toFixed(decimals)}%`;

export default function PredictorPage() {
  const [raceId, setRaceId] = useState<number | undefined>(undefined);
  const { data: pred, isLoading, isError } = usePredictRace(raceId);
  const { data: seasonRaces } = useSeasonRaces(pred?.season);

  const maxShare = useMemo(
    () => Math.max(...(pred?.entries.map((e) => e.win_prob) ?? [1])),
    [pred],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <SectionHeading
        title="Race Predictor"
        subtitle="Win, podium and points probabilities from gradient-boosted models trained on every race since 2014"
        action={
          seasonRaces && pred ? (
            <select
              value={raceId ?? pred.race_id}
              onChange={(e) => setRaceId(Number(e.target.value))}
              className="max-w-[230px] rounded-lg border border-white/10 bg-carbon-800 px-3 py-2 text-sm text-silver outline-none transition focus:border-f1-red/50"
              aria-label="Choose a race"
            >
              {seasonRaces.map((r) => (
                <option key={r.race_id} value={r.race_id}>
                  R{r.round} · {r.name.replace(" Grand Prix", " GP")}
                  {r.completed ? " ✓" : ""}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {isError ? (
        <GlassCard className="flex items-center gap-3 px-5 py-6 text-sm text-muted">
          <TriangleAlert className="h-4 w-4 text-f1-red" />
          Prediction service unavailable — is the backend running with trained artifacts?
        </GlassCard>
      ) : isLoading || !pred ? (
        <PredictorSkeleton />
      ) : (
        <>
          {/* race context strip */}
          <GlassCard className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
                Round {pred.round} · {pred.season}
              </p>
              <h3 className="mt-1 truncate font-display text-xl font-bold sm:text-2xl">
                {pred.name}
              </h3>
              <p className="mt-0.5 text-xs text-silver">
                {pred.circuit.name} ·{" "}
                {new Date(pred.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pred.completed && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
                  Backtest — race already run
                </span>
              )}
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-silver">
                {GRID_SOURCE_LABEL[pred.grid_source] ?? pred.grid_source}
              </span>
            </div>
          </GlassCard>

          {/* podium spotlight */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {pred.entries.slice(0, 3).map((entry, i) => (
              <PodiumCard key={entry.driver.id} entry={entry} rank={i + 1} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* full field */}
            <GlassCard className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest">
                  The Full Field
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  win · podium · points
                </p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {pred.entries.map((entry, i) => (
                  <FieldRow
                    key={entry.driver.id}
                    entry={entry}
                    rank={i + 1}
                    maxShare={maxShare}
                    completed={pred.completed}
                  />
                ))}
              </div>
            </GlassCard>

            {/* model panel */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatTile
                  label="Model certainty"
                  value={<CountUp value={pred.certainty * 100} suffix="%" />}
                  sub="how one-sided the field looks"
                />
                <StatTile
                  label="Winner hit rate"
                  value={
                    pred.model.winner_pick_rate != null
                      ? `${Math.round(pred.model.winner_pick_rate * 100)}%`
                      : "—"
                  }
                  sub={`on ${pred.model.holdout_races ?? "—"} unseen races`}
                />
              </div>

              <GlassCard className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-f1-red" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest">
                    Under the Hood
                  </h3>
                </div>
                <dl className="mt-4 space-y-2.5 text-xs">
                  <ModelFact label="Algorithm" value={pred.model.algorithm} />
                  <ModelFact label="Trained on" value={`Seasons ${pred.model.train_seasons ?? "—"}`} />
                  <ModelFact
                    label="Validated on"
                    value={`${pred.model.holdout_races ?? "—"} races it never saw (${pred.model.holdout_seasons ?? "—"})`}
                  />
                  <ModelFact
                    label="Discrimination"
                    value={`AUC ${pred.model.auc_win ?? "—"} (win) · ${pred.model.auc_podium ?? "—"} (podium)`}
                  />
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pred.model.features.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-muted">
                  Probabilities, not promises. The model reads form, grid and history —
                  it can&apos;t see rain, red flags or lap-one contact. That&apos;s racing.
                </p>
              </GlassCard>
            </div>
          </div>

          <ChampionshipSection />
        </>
      )}
    </div>
  );
}

function PodiumCard({ entry, rank }: { entry: RacePredictionEntry; rank: number }) {
  const color = entry.constructor?.color ?? FALLBACK;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.06 }}
    >
      <DriverPhotoTile
        driver={entry.driver}
        teamColor={color}
        className="aspect-[3/4]"
        badge={
          <span className="font-display text-4xl font-bold italic text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {String(rank).padStart(2, "0")}
          </span>
        }
      >
        <p className="truncate font-display text-lg font-bold uppercase italic leading-none">
          {entry.driver.full_name}
        </p>
        <p className="mt-1 truncate text-[11px] text-muted">
          {entry.constructor?.name ?? "—"} · P{entry.grid}
        </p>
        <div className="mt-2.5 flex items-end justify-between border-t border-white/15 pt-2.5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted">Win</p>
            <p className="font-numeric text-2xl font-bold tabular-nums leading-none">
              <CountUp value={entry.win_prob * 100} decimals={1} suffix="%" />
            </p>
          </div>
          <p className="text-[11px] tabular-nums text-silver">podium {pct(entry.podium_prob)}</p>
        </div>
      </DriverPhotoTile>
    </motion.div>
  );
}

function FieldRow({
  entry,
  rank,
  maxShare,
  completed,
}: {
  entry: RacePredictionEntry;
  rank: number;
  maxShare: number;
  completed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const color = entry.constructor?.color ?? FALLBACK;
  const width = maxShare > 0 ? (entry.win_prob / maxShare) * 100 : 0;
  const hit = completed && rank === 1 && entry.actual_position === 1;

  return (
    <div className="px-5 py-2.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-[1.5rem_auto_1fr_auto] items-center gap-3 text-left"
        aria-expanded={open}
      >
        <span className="text-xs tabular-nums text-muted">{rank}</span>
        <DriverAvatar driver={entry.driver} teamColor={color} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{entry.driver.full_name}</p>
            <span className="hidden text-[10px] uppercase tracking-wider text-muted sm:inline">
              P{entry.grid}
            </span>
            {completed && (
              <span
                className={cn(
                  "rounded border px-1.5 py-px text-[10px] font-semibold tabular-nums",
                  hit ? "border-success/40 text-success" : "border-white/10 text-silver",
                )}
              >
                {entry.actual_position
                  ? `finished P${entry.actual_position}`
                  : entry.actual_text
                    ? `out (${entry.actual_text})`
                    : "—"}
              </span>
            )}
          </div>
          {/* win-share bar — scaled to the favourite; the number is the truth */}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-sm font-bold tabular-nums">{pct(entry.win_prob, 1)}</p>
            <p className="text-[10px] tabular-nums text-muted">
              {pct(entry.podium_prob)} · {pct(entry.top10_prob)}
            </p>
          </div>
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 pb-1.5 pl-[4.25rem] pt-2">
          {entry.factors.map((f) => (
            <span
              key={f.text}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-silver"
            >
              <span className={f.positive ? "text-success" : "text-danger"}>
                {f.positive ? "▲" : "▼"}
              </span>
              {f.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ModelFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right text-silver">{value}</dd>
    </div>
  );
}

function ChampionshipSection() {
  const { data: sim, isLoading, isError } = useChampionshipSim();

  if (isError) return null;

  const contenders = (sim?.contenders ?? []).filter(
    (c, i) => i < 3 || c.title_prob >= 0.001 || c.top3_prob >= 0.01,
  );
  const remaining = sim ? sim.total_rounds - sim.completed_rounds : 0;

  return (
    <section>
      <SectionHeading
        title="The Title Fight"
        subtitle={
          sim
            ? `${sim.iterations.toLocaleString()} simulated season endings from today's standings — ${remaining} rounds (${sim.remaining_sprints} sprints) to go`
            : "Simulating the rest of the season…"
        }
      />
      {isLoading || !sim ? (
        <GlassCard className="space-y-4 px-5 py-5">
          <p className="text-xs text-muted">
            Running the remaining races a few thousand times — first load takes a moment.
          </p>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-8 w-3/5" />
        </GlassCard>
      ) : (
        <GlassCard className="divide-y divide-white/[0.04]">
          {contenders.map((c) => {
            const color = c.constructor?.color ?? FALLBACK;
            return (
              <div key={c.driver.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3">
                <DriverAvatar driver={c.driver} teamColor={color} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-medium">{c.driver.full_name}</p>
                    <span className="text-[10px] text-muted">
                      {c.current_points.toFixed(0)} pts now
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${c.title_prob * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold tabular-nums">
                    {c.title_prob >= 0.9995
                      ? "100%"
                      : c.title_prob < 0.001 && c.title_prob > 0
                        ? "<0.1%"
                        : pct(c.title_prob, 1)}
                  </p>
                  <p className="text-[10px] tabular-nums text-muted">
                    top 3 {pct(c.top3_prob)} · E[{c.expected_points.toFixed(0)} pts]
                  </p>
                </div>
              </div>
            );
          })}
          <p className="px-5 py-3 text-[11px] leading-relaxed text-muted">
            Plackett–Luce Monte Carlo seeded with the model&apos;s per-race win probabilities,
            with season-long pace drift baked in. {sim.season} scoring: 25–1 per Grand Prix,
            8–1 per sprint.
          </p>
        </GlassCard>
      )}
    </section>
  );
}

function PredictorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
