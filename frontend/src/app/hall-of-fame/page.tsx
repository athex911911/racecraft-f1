"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Crown, Flag, Gauge, Medal, Timer, Trophy } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useHallOfFame } from "@/lib/api/hooks";
import { CHAPTERS, RECORD_PORTRAITS, type Chapter, type Stat } from "@/lib/design/legends";
import { cn } from "@/lib/utils";
import type { RecordCategory, RecordEntry } from "@/types/f1";

const STAT_ICONS = { trophy: Trophy, wins: Flag, poles: Gauge, fl: Timer, podiums: Medal };
const START_PAGE = 4; // features begin on page 4

/* ================================================================== */
/*  Magazine                                                          */
/* ================================================================== */

export default function HallOfFamePage() {
  const { data, isLoading } = useHallOfFame();

  return (
    <div className="-mx-4 -my-6 bg-[#0b0a0a] text-foreground sm:-mx-6 lg:-mx-8">
      <Cover />
      <Contents />
      {CHAPTERS.map((c, i) => (
        <Feature key={c.ref} chapter={c} index={i} page={START_PAGE + i * 2} />
      ))}
      <ByTheNumbers data={data} isLoading={isLoading} page={START_PAGE + CHAPTERS.length * 2} />
    </div>
  );
}

/* ================================================================== */
/*  Cover                                                             */
/* ================================================================== */

function Cover() {
  const hero = CHAPTERS[0].action;
  const lines = [
    { n: "01", t: "Senna", d: "The Rain Master, and the myth that never faded" },
    { n: "02", t: "Schumacher", d: "How one man built an empire in red" },
    { n: "03", t: "Hamilton", d: "Seven titles — and the chase for eight" },
    { n: "06", t: "Verstappen", d: "The new era arrives, all at once" },
  ];
  return (
    <section className="relative flex h-screen flex-col overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={hero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0a0a] via-[#0b0a0a]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a0a] via-transparent to-[#0b0a0a]/80" />

      {/* masthead bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/15 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-silver sm:px-10">
        <span>F1 Insight</span>
        <span className="text-f1-red">Special Collector's Edition</span>
        <span>No. 01 · 2026</span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 sm:px-10 lg:px-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="font-display text-sm font-bold uppercase tracking-[0.5em] text-[#E8B54D]"
        >
          The Greats
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-3 font-display text-6xl font-bold uppercase italic leading-[0.82] tracking-tight sm:text-8xl xl:text-9xl"
        >
          Hall of
          <br />
          <span className="text-f1-red">Fame</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 max-w-md font-serif text-base italic leading-relaxed text-silver sm:text-lg"
        >
          The drivers who built Formula One — their careers, their numbers, and the moments that made
          them immortal.
        </motion.p>

        {/* cover lines */}
        <div className="mt-10 grid max-w-2xl gap-x-8 gap-y-3 sm:grid-cols-2">
          {lines.map((l) => (
            <div key={l.n} className="flex items-baseline gap-3 border-t border-white/10 pt-2">
              <span className="font-display text-xs font-bold text-f1-red">{l.n}</span>
              <span>
                <span className="font-display text-sm font-bold uppercase tracking-wide">{l.t}</span>
                <span className="block font-serif text-xs italic text-muted">{l.d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/15 px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-muted sm:px-10">
        <span className="font-mono">▐▌│║▌│ █║▌│ 2026</span>
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="flex items-center gap-1 text-silver">
          Turn the page <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
        <span>athex.f1</span>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Contents                                                          */
/* ================================================================== */

function Contents() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-f1-red">In This Issue</p>
          <h2 className="mt-3 font-display text-5xl font-bold uppercase italic tracking-tight sm:text-6xl">
            Contents
          </h2>
          <p className="mt-6 font-serif text-base italic leading-relaxed text-silver">
            An editor's note — Every era of this sport has produced someone who bent it to their will.
            These are six of them, told in full, and the records they left behind for the rest of us to
            chase.
          </p>
          <p className="mt-4 font-serif text-sm leading-relaxed text-muted">
            — The Editors, F1 Insight
          </p>
        </div>

        <ul className="lg:border-l lg:border-white/10 lg:pl-12">
          {CHAPTERS.map((c, i) => (
            <li key={c.ref}>
              <a
                href={`#feature-${i}`}
                className="group flex items-center gap-5 border-b border-white/8 py-5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="font-display text-3xl font-bold tabular-nums" style={{ color: c.accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-bold uppercase tracking-tight">
                    {c.first} {c.last}
                  </span>
                  <span className="block font-serif text-sm italic text-muted">{c.epithet} · {c.era}</span>
                </span>
                <span className="font-serif text-sm text-muted">p.{String(START_PAGE + i * 2).padStart(2, "0")}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-white" />
              </a>
            </li>
          ))}
          <li>
            <a href="#numbers" className="group flex items-center gap-5 py-5 transition-colors hover:bg-white/[0.02]">
              <span className="font-display text-3xl font-bold text-[#E8B54D]">—</span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl font-bold uppercase tracking-tight">By the Numbers</span>
                <span className="block font-serif text-sm italic text-muted">Every record that still stands</span>
              </span>
              <span className="font-serif text-sm text-muted">p.{String(START_PAGE + CHAPTERS.length * 2).padStart(2, "0")}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-white" />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Feature spread                                                    */
/* ================================================================== */

function Feature({ chapter: c, index, page }: { chapter: Chapter; index: number; page: number }) {
  const reverse = index % 2 === 1;

  return (
    <section
      id={`feature-${index}`}
      className="relative border-t border-white/10 scroll-mt-16"
    >
      {/* per-legend wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(60% 50% at ${reverse ? "80%" : "20%"} 30%, ${c.accent}10, transparent 70%)` }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
        {/* kicker + headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="flex items-center gap-3 font-display text-xs font-bold uppercase tracking-[0.35em]" style={{ color: c.accent }}>
            <span className="h-px w-10" style={{ background: c.accent }} />
            Legends — No. {String(index + 1).padStart(2, "0")} · {c.era}
          </p>
          <h2 className="mt-4 font-display text-6xl font-bold uppercase italic leading-[0.85] tracking-tight sm:text-8xl">
            {c.first} <span style={{ color: c.accent }}>{c.last}</span>
          </h2>
        </motion.div>

        {/* spread body */}
        <div className={cn("mt-10 grid gap-10 lg:grid-cols-12")}>
          {/* photo */}
          <motion.figure
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className={cn("lg:col-span-5", reverse ? "lg:order-2" : "lg:order-1")}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.portrait} alt={`${c.first} ${c.last}`} className="h-full w-full object-cover object-top" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>
            <figcaption className="mt-3 border-l-2 pl-3 font-serif text-xs italic text-muted" style={{ borderColor: c.accent }}>
              {c.first} {c.last} — {c.nationality}, {c.years}.
            </figcaption>
          </motion.figure>

          {/* text column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={cn("lg:col-span-7", reverse ? "lg:order-1" : "lg:order-2")}
          >
            <p className="font-serif text-xl font-semibold italic leading-snug text-foreground sm:text-2xl">
              {c.standfirst}
            </p>

            <div className="mt-6 gap-x-8 font-serif text-[15px] leading-relaxed text-silver sm:columns-2 [&>p]:mb-4 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:leading-[0.7] [&>p:first-of-type]:first-letter:text-[#E8B54D]">
              {c.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* pull quote */}
            <blockquote className="my-8 border-y border-white/10 py-6 text-center font-serif text-2xl font-semibold italic leading-snug sm:text-3xl">
              <span style={{ color: c.accent }}>“</span>
              {c.quote}
              <span style={{ color: c.accent }}>”</span>
            </blockquote>

            {/* fact box */}
            <div className="rounded-sm border border-white/12 bg-black/30 p-5">
              <p className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                By the Numbers
                <span className="h-px w-12" style={{ background: c.accent }} />
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {c.stats.map((s) => (
                  <FactStat key={s.label} stat={s} accent={c.accent} />
                ))}
              </div>
            </div>

            <Link
              href={c.eraData ? `/drivers/${c.ref}` : c.wiki}
              {...(c.eraData ? {} : { target: "_blank", rel: "noreferrer" })}
              className="group mt-6 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest transition"
              style={{ color: c.accent }}
            >
              {c.eraData ? "Read the full career" : "Continue the story"}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* folio */}
        <div className="mt-12 flex items-center justify-between border-t border-white/8 pt-4 text-[10px] uppercase tracking-[0.25em] text-muted">
          <span>F1 Insight · Hall of Fame</span>
          <span className="font-display font-bold">— {String(page).padStart(2, "0")} —</span>
          <span>{c.last}</span>
        </div>
      </div>
    </section>
  );
}

function FactStat({ stat: s, accent }: { stat: Stat; accent: string }) {
  const Icon = STAT_ICONS[s.icon];
  return (
    <div>
      <Icon className="h-4 w-4" style={{ color: accent }} />
      <p className="mt-1.5 font-display text-3xl font-bold leading-none tabular-nums">{s.value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-silver">{s.label}</p>
    </div>
  );
}

/* ================================================================== */
/*  By the numbers (records)                                          */
/* ================================================================== */

function ByTheNumbers({
  data,
  isLoading,
  page,
}: {
  data: ReturnType<typeof useHallOfFame>["data"];
  isLoading: boolean;
  page: number;
}) {
  return (
    <section id="numbers" className="relative border-t border-white/10 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="mb-12 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.4em] text-[#E8B54D]">
            The Data Pages
          </p>
          <h2 className="mt-3 font-display text-5xl font-bold uppercase italic tracking-tight sm:text-7xl">
            By the Numbers
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-serif text-base italic text-silver">
            The stories fade; the records remain. These are the marks that still stand across the modern
            era{data ? ` (${data.seasons_covered})` : ""}.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.25em] text-silver">Drivers</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.drivers.map((cat, i) => (
                  <RecordCard key={cat.key} category={cat} kind="drivers" index={i} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.25em] text-silver">Constructors</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.constructors.map((cat, i) => (
                  <RecordCard key={cat.key} category={cat} kind="constructors" index={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-between border-t border-white/8 pt-4 text-[10px] uppercase tracking-[0.25em] text-muted">
          <span>F1 Insight · Hall of Fame</span>
          <span className="font-display font-bold">— {String(page).padStart(2, "0")} —</span>
          <span>Fin</span>
        </div>

        <p className="mt-6 text-center font-serif text-xs italic text-muted">
          Career achievements in the features are all-time records; the data pages are computed from the
          ingested era{data ? ` (${data.seasons_covered})` : ""}.
        </p>
      </div>
    </section>
  );
}

function RecordCard({ category, kind, index }: { category: RecordCategory; kind: "drivers" | "constructors"; index: number }) {
  const max = Math.max(...category.entries.map((e) => e.value), 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group h-full border border-white/10 bg-black/20 p-5 transition-colors duration-500 hover:border-[#E8B54D]/30"
    >
      <p className="mb-5 flex items-center justify-between font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {category.title}
        <span className="h-px w-10 bg-gradient-to-r from-[#E8B54D]/60 to-transparent" />
      </p>
      <div className="space-y-3">
        {category.entries.map((e, i) => (
          <RecordRow key={e.label + i} entry={e} rank={i + 1} max={max} kind={kind} />
        ))}
      </div>
    </motion.div>
  );
}

function RecordRow({ entry, rank, max, kind }: { entry: RecordEntry; rank: number; max: number; kind: "drivers" | "constructors" }) {
  const leader = rank === 1;
  const portrait = kind === "drivers" && entry.ref ? RECORD_PORTRAITS[entry.ref] : undefined;
  const barColor = leader ? "#E8B54D" : entry.color ?? "#6a6a6a";

  const body = (
    <div className="flex items-center gap-3">
      <span className="w-5 text-center">
        {leader ? (
          <Crown className="mx-auto h-4 w-4 text-[#E8B54D]" />
        ) : (
          <span className="font-display text-sm font-bold tabular-nums text-muted">{rank}</span>
        )}
      </span>
      {portrait ? (
        <span className={cn("h-9 w-9 shrink-0 overflow-hidden rounded-full", leader ? "ring-2 ring-[#E8B54D]/70" : "ring-1 ring-white/15")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portrait} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
        </span>
      ) : (
        <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: entry.color ?? "#3d3d3d" }} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", leader ? "font-semibold text-foreground" : "text-silver")}>{entry.label}</span>
          <span className={cn("shrink-0 font-display font-bold tabular-nums", leader ? "text-base text-[#E8B54D]" : "text-sm text-silver")}>
            {entry.display}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor, opacity: leader ? 1 : 0.55 }}
            initial={{ width: 0 }}
            whileInView={{ width: `${(entry.value / max) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );

  return entry.ref ? (
    <Link href={`/${kind}/${entry.ref}`} className="block rounded-lg px-1 py-0.5 transition hover:bg-white/[0.04]">
      {body}
    </Link>
  ) : (
    body
  );
}
