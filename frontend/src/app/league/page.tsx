"use client";

import { Check, Crown, Flag, Gauge, Lock, Medal, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  useLeaderboard,
  useLeagueRace,
  useLeagueRaces,
  useMyPredictions,
  useSubmitPrediction,
} from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import type {
  LeagueDriverOption,
  LeagueRaceItem,
  PredictionPicks,
  ScoreBreakdown,
} from "@/types/f1";

const SLOTS: {
  key: keyof PredictionPicks;
  label: string;
  icon: React.ReactNode;
  points: string;
}[] = [
  { key: "pole_driver_id", label: "Pole", icon: <Gauge className="h-4 w-4" />, points: "+10" },
  { key: "winner_driver_id", label: "Winner", icon: <Trophy className="h-4 w-4" />, points: "+25" },
  { key: "p2_driver_id", label: "2nd", icon: <Medal className="h-4 w-4" />, points: "+15" },
  { key: "p3_driver_id", label: "3rd", icon: <Medal className="h-4 w-4" />, points: "+15" },
  { key: "fastest_lap_driver_id", label: "Fastest Lap", icon: <Flag className="h-4 w-4" />, points: "+10" },
];

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function LeaguePage() {
  const { user } = useAuth();
  const { data: racesData, isLoading: loadingRaces } = useLeagueRaces();
  const { data: leaderboard } = useLeaderboard();
  const { data: mine } = useMyPredictions(!!user);

  const openRaces = useMemo(
    () => racesData?.races.filter((r) => r.status === "open") ?? [],
    [racesData],
  );

  const [raceId, setRaceId] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (raceId === undefined && openRaces.length) setRaceId(openRaces[0].race_id);
  }, [openRaces, raceId]);

  const yourPoints = mine?.total_points ?? 0;
  const yourRank = leaderboard?.your_rank ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeading
        title="Prediction League"
        subtitle="Call the pole, podium and fastest lap before lights out — score points, climb the board"
        action={
          user && yourRank ? (
            <div className="flex items-center gap-2 rounded-lg rounded-tr-none border border-f1-red/40 bg-f1-red/10 px-3.5 py-2">
              <Crown className="h-4 w-4 text-f1-red" />
              <span className="font-display text-sm font-bold text-white">
                Rank #{yourRank} · {yourPoints} pts
              </span>
            </div>
          ) : null
        }
      />

      {!user ? (
        <GlassCard className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-silver">
            <span className="font-semibold text-white">Sign in</span> to make predictions and climb
            the leaderboard. You can browse the standings below.
          </p>
          <Link
            href="/login"
            className="rounded-lg rounded-tr-none bg-f1-red px-4 py-2 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-f1-red/90"
          >
            Sign in
          </Link>
        </GlassCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-8 lg:col-span-2">
          {loadingRaces ? (
            <Skeleton className="h-80" />
          ) : openRaces.length === 0 ? (
            <GlassCard className="px-5 py-10 text-center text-sm text-muted">
              No upcoming races are open for prediction right now.
            </GlassCard>
          ) : (
            <MakePicks
              races={openRaces}
              raceId={raceId}
              onRace={setRaceId}
              canSubmit={!!user}
            />
          )}

          {user && mine ? <YourResults items={mine.items} /> : null}
        </div>

        {/* sidebar */}
        <aside className="space-y-6">
          <LeaderboardCard />
          <ScoringRules max={racesData?.max_points ?? 75} />
        </aside>
      </div>
    </div>
  );
}

function MakePicks({
  races,
  raceId,
  onRace,
  canSubmit,
}: {
  races: LeagueRaceItem[];
  raceId: number | undefined;
  onRace: (id: number) => void;
  canSubmit: boolean;
}) {
  const { data: detail, isLoading } = useLeagueRace(raceId);
  const submit = useSubmitPrediction();
  const toast = useToast();

  const [picks, setPicks] = useState<PredictionPicks>({
    pole_driver_id: null,
    winner_driver_id: null,
    p2_driver_id: null,
    p3_driver_id: null,
    fastest_lap_driver_id: null,
  });

  // hydrate from the saved prediction when the race changes
  useEffect(() => {
    if (detail) {
      setPicks(
        detail.prediction ?? {
          pole_driver_id: null,
          winner_driver_id: null,
          p2_driver_id: null,
          p3_driver_id: null,
          fastest_lap_driver_id: null,
        },
      );
      submit.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.race.race_id]);

  const options = detail?.options ?? [];
  const race = races.find((r) => r.race_id === raceId);

  const onSubmit = () => {
    if (!raceId) return;
    submit.mutate(
      { race_id: raceId, ...picks },
      {
        onSuccess: () => toast("Picks saved!"),
        onError: (e) => toast((e as Error).message || "Couldn't save picks", "error"),
      },
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-silver">
          Make Your Picks
        </h3>
        <select
          value={raceId}
          onChange={(e) => onRace(Number(e.target.value))}
          className="max-w-[260px] rounded-lg rounded-tr-none border border-white/10 bg-carbon-800 px-3 py-2 text-sm text-silver outline-none transition focus:border-f1-red/50"
          aria-label="Choose a race"
        >
          {races.map((r) => (
            <option key={r.race_id} value={r.race_id}>
              R{r.round} · {r.name.replace(" Grand Prix", " GP")} · {fmtDate(r.date)}
            </option>
          ))}
        </select>
      </div>

      <GlassCard className="p-5 sm:p-6">
        {isLoading || !detail ? (
          <Skeleton className="h-64" />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-xs text-muted">
              <Lock className="h-3.5 w-3.5" />
              Picks lock at lights out on {race ? fmtDate(race.date) : ""}. You can edit until then.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {SLOTS.map((slot) => (
                <DriverSelect
                  key={slot.key}
                  slot={slot}
                  options={options}
                  value={picks[slot.key]}
                  onChange={(v) => setPicks((p) => ({ ...p, [slot.key]: v }))}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={onSubmit}
                disabled={!canSubmit || submit.isPending}
                className="rounded-lg rounded-tr-none bg-f1-red px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-f1-red/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submit.isPending ? "Saving…" : detail.prediction ? "Update picks" : "Submit picks"}
              </button>
              {!canSubmit ? (
                <Link href="/login" className="text-sm font-semibold text-f1-red hover:underline">
                  Sign in to submit
                </Link>
              ) : submit.isSuccess ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" /> Picks saved
                </span>
              ) : submit.isError ? (
                <span className="text-sm font-semibold text-f1-red">
                  {(submit.error as Error).message}
                </span>
              ) : null}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

function DriverSelect({
  slot,
  options,
  value,
  onChange,
}: {
  slot: { label: string; icon: React.ReactNode; points: string };
  options: LeagueDriverOption[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
        <span className="text-f1-red">{slot.icon}</span>
        {slot.label}
        <span className="ml-auto text-muted/70">{slot.points}</span>
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-lg rounded-tr-none border border-white/10 bg-carbon-800 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-f1-red/50"
      >
        <option value="">— pick a driver —</option>
        {options.map((o) => (
          <option key={o.driver.id} value={o.driver.id}>
            {o.driver.full_name}
            {o.constructor ? ` · ${o.constructor.name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function YourResults({ items }: { items: { race: LeagueRaceItem; picks: PredictionPicks; score: ScoreBreakdown | null }[] }) {
  const scored = items.filter((i) => i.race.status === "completed" && i.score);
  if (!scored.length) return null;

  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-silver">
        Your Results
      </h3>
      <div className="space-y-2">
        {scored.map(({ race, score }) => (
          <GlassCard key={race.race_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold">
                R{race.round} · {race.name}
              </p>
              <p className="text-xs text-muted">{fmtDate(race.date)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Pill label="Pole" pts={score!.pole} />
              <Pill label="Win" pts={score!.winner} />
              <Pill label="Podium" pts={score!.podium} />
              <Pill label="FL" pts={score!.fastest_lap} />
            </div>
            <div className="w-16 text-right">
              <span className="font-display text-xl font-bold tabular-nums text-f1-red">
                {score!.total}
              </span>
              <span className="ml-1 text-[10px] uppercase tracking-widest text-muted">pts</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function Pill({ label, pts }: { label: string; pts: number }) {
  const hit = pts > 0;
  return (
    <span
      className={cn(
        "hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex",
        hit ? "bg-success/15 text-success ring-1 ring-success/30" : "bg-white/5 text-muted",
      )}
      title={`${label}: ${pts} pts`}
    >
      {hit ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

function LeaderboardCard() {
  const { data, isLoading } = useLeaderboard();

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-silver">
        <Trophy className="h-4 w-4 text-f1-red" /> Standings
      </h3>
      <GlassCard className="p-2">
        {isLoading || !data ? (
          <Skeleton className="h-64" />
        ) : data.entries.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">
            No predictions scored yet. Be the first.
          </p>
        ) : (
          <ol className="space-y-0.5">
            {data.entries.slice(0, 12).map((e) => (
              <li
                key={e.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2",
                  e.is_you ? "bg-f1-red/10 ring-1 ring-f1-red/30" : "hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "w-5 text-center font-display text-sm font-bold tabular-nums",
                    e.rank === 1 ? "text-warning" : "text-muted",
                  )}
                >
                  {e.rank}
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-carbon-800 text-[10px] font-bold text-silver ring-1 ring-white/10">
                  {(e.display_name || e.username).slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  <span className={cn("font-semibold", e.is_you ? "text-white" : "text-silver")}>
                    {e.display_name || e.username}
                  </span>
                  {e.is_you ? <span className="ml-1.5 text-[10px] text-f1-red">YOU</span> : null}
                </span>
                <span className="font-display text-sm font-bold tabular-nums text-white">
                  {e.total_points}
                </span>
              </li>
            ))}
          </ol>
        )}
      </GlassCard>
    </div>
  );
}

function ScoringRules({ max }: { max: number }) {
  const rules = [
    { label: "Correct winner", pts: "+25" },
    { label: "Exact podium slot (2nd / 3rd)", pts: "+15" },
    { label: "Right pole", pts: "+10" },
    { label: "Right fastest lap", pts: "+10" },
    { label: "Podium driver, wrong slot", pts: "+5" },
  ];
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-silver">
        Scoring
      </h3>
      <GlassCard className="space-y-2 px-4 py-4">
        {rules.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-silver">{r.label}</span>
            <span className="font-display font-bold tabular-nums text-success">{r.pts}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between border-t border-white/8 pt-2 text-sm">
          <span className="font-semibold text-white">Max per race</span>
          <span className="font-display font-bold tabular-nums text-f1-red">{max}</span>
        </div>
      </GlassCard>
    </div>
  );
}
