"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useHallOfFame } from "@/lib/api/hooks";
import type { RecordCategory, RecordEntry } from "@/types/f1";

export default function HallOfFamePage() {
  const { data, isLoading } = useHallOfFame();

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="relative overflow-hidden rounded-card border border-white/8 bg-carbon-950 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-warning/10 blur-3xl"
          aria-hidden
        />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-warning">
          <Trophy className="h-4 w-4" /> Hall of Fame
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase italic tracking-tight sm:text-4xl">
          All-Time Records
        </h1>
        <p className="mt-2 text-sm text-muted">
          Career leaders across the ingested era{data ? ` · ${data.seasons_covered}` : ""}.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <SectionHeading title="Drivers" subtitle="The greatest of the era" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.drivers.map((cat, i) => (
                <RecordCard key={cat.key} category={cat} kind="drivers" index={i} />
              ))}
            </div>
          </section>
          <section>
            <SectionHeading title="Constructors" subtitle="The dominant teams" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.constructors.map((cat, i) => (
                <RecordCard key={cat.key} category={cat} kind="constructors" index={i} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function RecordCard({
  category,
  kind,
  index,
}: {
  category: RecordCategory;
  kind: "drivers" | "constructors";
  index: number;
}) {
  const max = Math.max(...category.entries.map((e) => e.value), 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
    >
      <GlassCard className="h-full p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
          {category.title}
        </p>
        <div className="space-y-2.5">
          {category.entries.map((e, i) => (
            <Row key={e.label + i} entry={e} rank={i + 1} max={max} kind={kind} />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Row({
  entry,
  rank,
  max,
  kind,
}: {
  entry: RecordEntry;
  rank: number;
  max: number;
  kind: "drivers" | "constructors";
}) {
  const leader = rank === 1;
  const body = (
    <div className="flex items-center gap-3">
      <span
        className={`w-4 text-center font-display text-sm font-bold tabular-nums ${
          leader ? "text-warning" : "text-muted"
        }`}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${leader ? "font-semibold text-foreground" : "text-silver"}`}>
            {entry.label}
          </span>
          <span className="shrink-0 font-display text-sm font-bold tabular-nums">
            {entry.display}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: entry.color ?? (leader ? "#FFD700" : "#8a8a8a") }}
            initial={{ width: 0 }}
            whileInView={{ width: `${(entry.value / max) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );

  return entry.ref ? (
    <Link href={`/${kind}/${entry.ref}`} className="block rounded transition hover:bg-white/[0.03]">
      {body}
    </Link>
  ) : (
    body
  );
}
