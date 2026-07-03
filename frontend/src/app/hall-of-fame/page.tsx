"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Crown, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useHallOfFame } from "@/lib/api/hooks";
import {
  DECADES,
  LEGENDS,
  MOMENTS,
  QUOTES,
  RECORD_PORTRAITS,
  type Legend,
} from "@/lib/design/legends";
import { cn } from "@/lib/utils";
import type { RecordCategory, RecordEntry } from "@/types/f1";

/* ------------------------------------------------------------------ */
/*  Shared                                                             */
/* ------------------------------------------------------------------ */

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function legendHref(l: Legend) {
  return l.eraData ? `/drivers/${l.ref}` : l.wiki;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HallOfFamePage() {
  const { data, isLoading } = useHallOfFame();

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* ambient museum lighting — decorative only */}
      <div className="pointer-events-none absolute -inset-x-8 -top-10 h-[520px]" aria-hidden>
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#FFD700]/[0.05] blur-3xl" />
        <div className="absolute right-10 top-24 h-96 w-96 rounded-full bg-f1-red/[0.07] blur-3xl" />
      </div>

      <div className="relative space-y-20 pb-10">
        <Hero />
        <LegendsGallery />
        <QuoteBlock index={0} />
        <MomentsSection />
        <Timeline />
        <QuoteBlock index={1} />
        <RecordsSection data={data} isLoading={isLoading} />

        <p className="text-center text-[11px] text-muted">
          Statistical records cover the ingested era{data ? ` (${data.seasons_covered})` : ""} — the
          archive deepens as more seasons are loaded. The stories above belong to all of Formula One.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero — a promotional poster, not a rectangle                       */
/* ------------------------------------------------------------------ */

const HERO_COLLAGE = ["senna", "michael_schumacher", "hamilton", "fangio"] as const;

function Hero() {
  const legends = HERO_COLLAGE.map((ref) => LEGENDS.find((l) => l.ref === ref)!).filter(Boolean);

  return (
    <section className="relative min-h-[480px] overflow-hidden rounded-card border border-white/8 bg-[#0a0908] shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
      {/* portrait collage, fading into the dark */}
      <div className="absolute inset-y-0 right-0 hidden w-[62%] isolate sm:block" aria-hidden>
        {legends.map((l, i) => (
          <motion.img
            key={l.ref}
            src={l.portrait}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15 * i, ease: "easeOut" }}
            className={cn("absolute h-[115%] w-[38%] object-cover object-top", l.mono && "grayscale")}
            style={{
              left: `${i * 21}%`,
              top: i % 2 ? "6%" : "-8%",
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(180deg, black 60%, transparent 98%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, black 22%, black 78%, transparent 100%)",
              maskComposite: "intersect",
              filter: l.mono ? "grayscale(1) contrast(1.05)" : undefined,
              zIndex: 4 - i,
            }}
          />
        ))}
        {/* grade over the collage */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0908] via-[#0a0908]/35 to-[#0a0908]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-[#0a0908]/60" />
      </div>

      {/* readability scrim under the editorial copy */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[72%] bg-gradient-to-r from-[#0a0908] from-28% via-[#0a0908]/85 via-55% to-transparent sm:block"
        aria-hidden
      />

      {/* smoke / light leak */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 78% 20%, rgba(255,215,0,0.06), transparent 65%), radial-gradient(45% 40% at 20% 90%, rgba(225,6,0,0.08), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-[#FFD700]/50 via-white/10 to-transparent" aria-hidden />

      <div className="relative flex min-h-[480px] max-w-xl flex-col justify-center p-8 sm:p-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em] text-[#FFD700]"
        >
          <Trophy className="h-4 w-4" /> Hall of Fame
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="mt-4 font-display text-4xl font-bold uppercase italic leading-[0.98] tracking-tight sm:text-6xl"
        >
          The Legends Who
          <br />
          Defined <span className="text-f1-red">Formula One</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="mt-5 font-display text-base italic text-silver sm:text-lg"
        >
          Records tell part of the story. Legacy tells the rest.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-muted"
        >
          Every generation has its icons. Every era has its heroes. Explore the careers,
          achievements and defining moments of the drivers who shaped this sport.
        </motion.p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Legends gallery — Netflix-poster cards                             */
/* ------------------------------------------------------------------ */

function LegendsGallery() {
  return (
    <section>
      <Reveal>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="speed-line font-display text-2xl font-bold tracking-tight sm:text-3xl">
              The Legends
            </h2>
            <p className="mt-3 text-sm text-muted">Eleven careers that changed the sport forever</p>
          </div>
          <p className="hidden text-[11px] uppercase tracking-widest text-muted sm:block">
            Scroll →
          </p>
        </div>
      </Reveal>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {LEGENDS.map((l, i) => (
          <motion.div
            key={l.ref}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.35) }}
            className="snap-start"
          >
            <LegendCard legend={l} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LegendCard({ legend: l }: { legend: Legend }) {
  const external = !l.eraData;
  const Wrapper = external ? "a" : Link;
  const props = external
    ? { href: l.wiki, target: "_blank", rel: "noreferrer" }
    : { href: `/drivers/${l.ref}` };

  return (
    <Wrapper
      {...props}
      className="group relative block h-[430px] w-[270px] shrink-0 overflow-hidden rounded-card border border-white/8 bg-carbon-850 transition-[border-color,box-shadow] duration-500 hover:border-[#FFD700]/40 hover:shadow-[0_0_40px_rgba(255,215,0,0.12)]"
    >
      {/* portrait */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={l.portrait}
        alt={l.name}
        loading="lazy"
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1.4s] ease-out group-hover:scale-[1.07]",
          l.mono && "grayscale",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 group-hover:via-black/55" />

      {/* championships badge */}
      <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-[#FFD700]/40 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-[#FFD700] backdrop-blur">
        <Trophy className="h-3 w-3" /> {l.titles}×
      </span>

      <div className="absolute inset-x-0 bottom-0 p-5">
        {/* epithet — revealed on hover */}
        <p className="translate-y-2 font-display text-xs font-semibold uppercase tracking-[0.25em] text-[#FFD700] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {l.epithet}
        </p>
        <p className="mt-1.5 font-display text-2xl font-bold leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {l.name}
        </p>
        <p className="mt-1.5 text-[11px] uppercase tracking-widest text-silver">
          {l.nationality} · {l.years}
        </p>
        <p className="mt-3 max-h-0 overflow-hidden text-xs leading-relaxed text-silver opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
          {l.bio}
        </p>
        <p className="mt-3 inline-flex translate-y-2 items-center gap-1 text-xs font-semibold uppercase tracking-widest text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          Explore legacy <ArrowUpRight className="h-3.5 w-3.5" />
        </p>
      </div>
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/*  Quotes — editorial separators                                      */
/* ------------------------------------------------------------------ */

function QuoteBlock({ index }: { index: number }) {
  const q = QUOTES[index];
  if (!q) return null;
  return (
    <Reveal className="mx-auto max-w-3xl py-4 text-center">
      <p className="font-display text-2xl font-bold italic leading-snug text-foreground/90 sm:text-3xl">
        “{q.text}”
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#FFD700]">
        — {q.author}
      </p>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Legendary moments                                                  */
/* ------------------------------------------------------------------ */

function MomentsSection() {
  return (
    <section>
      <Reveal>
        <div className="mb-6">
          <h2 className="speed-line font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Legendary Moments
          </h2>
          <p className="mt-3 text-sm text-muted">The races that became folklore</p>
        </div>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MOMENTS.map((m, i) => (
          <Reveal key={m.title} delay={Math.min(i * 0.06, 0.3)}>
            <a
              href={m.wiki}
              target="_blank"
              rel="noreferrer"
              className="group relative block h-64 overflow-hidden rounded-card border border-white/8 transition-[border-color] duration-500 hover:border-f1-red/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photo}
                alt={m.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
              <span className="absolute right-4 top-3 font-display text-4xl font-bold italic text-white/25 transition-colors duration-500 group-hover:text-[#FFD700]/60">
                {m.year}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {m.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-silver">{m.line}</p>
                <p className="mt-2.5 inline-flex translate-y-2 items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  View story <ArrowUpRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline — eight decades of Formula One                            */
/* ------------------------------------------------------------------ */

function Timeline() {
  const [active, setActive] = useState(DECADES.length - 1);
  const decade = DECADES[active];
  const featured = decade.featured
    .map((ref) => LEGENDS.find((l) => l.ref === ref)!)
    .filter(Boolean);

  return (
    <section>
      <Reveal>
        <div className="mb-6">
          <h2 className="speed-line font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Eight Decades of Speed
          </h2>
          <p className="mt-3 text-sm text-muted">Pick an era. Meet its heroes.</p>
        </div>
      </Reveal>

      <div className="overflow-hidden rounded-card border border-white/8 bg-carbon-900/60">
        {/* decade rail */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/5 p-2">
          {DECADES.map((d, i) => (
            <button
              key={d.label}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 font-display text-sm font-bold transition-colors",
                i === active
                  ? "bg-f1-red text-white"
                  : "text-muted hover:bg-white/5 hover:text-silver",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={decade.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto]"
          >
            {/* era backdrop portrait */}
            {featured[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured[0].portrait}
                alt=""
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 object-cover object-top opacity-[0.14] lg:block",
                  featured[0].mono && "grayscale",
                )}
                style={{
                  maskImage: "linear-gradient(270deg, black 30%, transparent 95%)",
                  WebkitMaskImage: "linear-gradient(270deg, black 30%, transparent 95%)",
                }}
              />
            )}

            <div className="relative max-w-xl">
              <p className="font-display text-5xl font-bold italic text-white/10">{decade.label}</p>
              <h3 className="-mt-5 font-display text-2xl font-bold text-[#FFD700]/90">{decade.era}</h3>
              <p className="mt-3 text-sm leading-relaxed text-silver">{decade.blurb}</p>
            </div>

            <div className="relative flex gap-3">
              {featured.map((l) => {
                const external = !l.eraData;
                const inner = (
                  <div className="group w-36 overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-colors hover:border-[#FFD700]/40">
                    <div className="h-40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={l.portrait}
                        alt={l.name}
                        loading="lazy"
                        className={cn(
                          "h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105",
                          l.mono && "grayscale",
                        )}
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-bold">{l.name}</p>
                      <p className="text-[10px] text-[#FFD700]">{l.titles}× champion</p>
                    </div>
                  </div>
                );
                return external ? (
                  <a key={l.ref} href={l.wiki} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  <Link key={l.ref} href={`/drivers/${l.ref}`}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Records — the exhibit hall (same data, new frame)                  */
/* ------------------------------------------------------------------ */

function RecordsSection({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useHallOfFame>["data"];
  isLoading: boolean;
}) {
  return (
    <section>
      <Reveal>
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#FFD700]">
            The Record Books
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase italic tracking-tight sm:text-4xl">
            Where Numbers Become Monuments
          </h2>
          <p className="mt-2 text-sm text-muted">
            Modern-era leaders{data ? ` · ${data.seasons_covered}` : ""}
          </p>
        </div>
      </Reveal>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <Reveal>
              <h3 className="mb-4 font-display text-lg font-bold text-silver">Drivers</h3>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.drivers.map((cat, i) => (
                <RecordCard key={cat.key} category={cat} kind="drivers" index={i} />
              ))}
            </div>
          </div>
          <div>
            <Reveal>
              <h3 className="mb-4 font-display text-lg font-bold text-silver">Constructors</h3>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.constructors.map((cat, i) => (
                <RecordCard key={cat.key} category={cat} kind="constructors" index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
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
    <Reveal delay={Math.min(index * 0.05, 0.3)}>
      <div className="group h-full rounded-card border border-white/8 bg-gradient-to-b from-carbon-800/60 to-carbon-900/80 p-5 transition-colors duration-500 hover:border-[#FFD700]/25">
        <p className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {category.title}
          <span className="h-px w-10 bg-gradient-to-r from-[#FFD700]/60 to-transparent" />
        </p>
        <div className="space-y-3">
          {category.entries.map((e, i) => (
            <RecordRow key={e.label + i} entry={e} rank={i + 1} max={max} kind={kind} />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function RecordRow({
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
  const portrait = kind === "drivers" && entry.ref ? RECORD_PORTRAITS[entry.ref] : undefined;
  const barColor = leader ? "#FFD700" : entry.color ?? "#6a6a6a";

  const body = (
    <div className="flex items-center gap-3">
      {/* rank / crown */}
      <span className="w-5 text-center">
        {leader ? (
          <Crown className="mx-auto h-4 w-4 text-[#FFD700]" />
        ) : (
          <span className="font-display text-sm font-bold tabular-nums text-muted">{rank}</span>
        )}
      </span>

      {/* portrait or colour chip */}
      {portrait ? (
        <span
          className={cn(
            "h-9 w-9 shrink-0 overflow-hidden rounded-full",
            leader ? "ring-2 ring-[#FFD700]/70" : "ring-1 ring-white/15",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portrait} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
        </span>
      ) : (
        <span
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ background: entry.color ?? "#3d3d3d" }}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", leader ? "font-semibold text-foreground" : "text-silver")}>
            {entry.label}
          </span>
          <span
            className={cn(
              "shrink-0 font-display font-bold tabular-nums",
              leader ? "text-base text-[#FFD700]" : "text-sm text-silver",
            )}
          >
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
    <Link
      href={`/${kind}/${entry.ref}`}
      className="block rounded-lg px-1 py-0.5 transition hover:bg-white/[0.04]"
    >
      {body}
    </Link>
  ) : (
    body
  );
}
