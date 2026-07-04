"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ChevronDown, Crown, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function HallOfFamePage() {
  const { data, isLoading } = useHallOfFame();

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <ScrollHero />
      <HorizontalLegends />
      <PinnedQuote quote={QUOTES[0]} image={MOMENTS[0].photo} />
      <MomentsSection />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Timeline />
      </div>
      <PinnedQuote quote={QUOTES[1]} image={MOMENTS[2].photo} mono />
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <RecordsSection data={data} isLoading={isLoading} />
        <p className="mt-10 text-center text-[11px] text-muted">
          Statistical records cover the ingested era{data ? ` (${data.seasons_covered})` : ""}. The
          stories above belong to all of Formula One.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  1 · Hero — parallaxes away as you scroll                          */
/* ================================================================== */

const HERO_COLLAGE = ["senna", "michael_schumacher", "hamilton", "fangio"] as const;

function ScrollHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const collageScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const legends = HERO_COLLAGE.map((r) => LEGENDS.find((l) => l.ref === r)!).filter(Boolean);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden bg-[#0a0908]">
      {/* collage */}
      <motion.div style={{ scale: collageScale }} className="absolute inset-y-0 right-0 hidden w-[64%] isolate sm:block" aria-hidden>
        {legends.map((l, i) => (
          <img
            key={l.ref}
            src={l.portrait}
            alt=""
            className={cn("absolute h-[118%] w-[40%] object-cover object-top", l.mono && "grayscale")}
            style={{
              left: `${i * 20}%`,
              top: i % 2 ? "4%" : "-10%",
              maskImage: "linear-gradient(90deg, transparent, black 24%, black 76%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 24%, black 76%, transparent)",
              zIndex: 4 - i,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0908] via-[#0a0908]/30 to-[#0a0908]/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-[#0a0908]/50" />
      </motion.div>

      {/* left scrim */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[74%] bg-gradient-to-r from-[#0a0908] from-26% via-[#0a0908]/85 via-55% to-transparent sm:block" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(50% 45% at 78% 18%, rgba(255,215,0,0.06), transparent 65%), radial-gradient(45% 40% at 15% 92%, rgba(225,6,0,0.08), transparent 70%)" }}
        aria-hidden
      />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative flex h-full max-w-2xl flex-col justify-center px-6 sm:px-14 lg:px-20"
      >
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em] text-[#FFD700]">
          <Trophy className="h-4 w-4" /> Hall of Fame
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold uppercase italic leading-[0.95] tracking-tight sm:text-7xl">
          The Legends
          <br />
          Who Defined
          <br />
          <span className="text-f1-red">Formula One</span>
        </h1>
        <p className="mt-6 font-display text-lg italic text-silver sm:text-xl">
          Records tell part of the story. Legacy tells the rest.
        </p>
      </motion.div>

      <motion.div
        style={{ opacity: cueOpacity }}
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-muted"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll to begin</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/*  2 · Horizontal scroll-jacked legends                              */
/* ================================================================== */

function HorizontalLegends() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!viewportRef.current || !trackRef.current) return;
      const vw = viewportRef.current.clientWidth;
      const tw = trackRef.current.scrollWidth;
      setMaxX(Math.max(tw - vw + 48, 0));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxX]);
  const railWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      {/* desktop: scroll-jacked horizontal track */}
      <section
        ref={sectionRef}
        className="relative hidden lg:block"
        style={{ height: `calc(100vh + ${maxX}px)` }}
      >
        <div ref={viewportRef} className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* heading + progress rail */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-end justify-between px-10 pt-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#FFD700]">The Immortals</p>
              <h2 className="mt-1 font-display text-3xl font-bold italic tracking-tight">Eleven Who Changed Everything</h2>
            </div>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div style={{ width: railWidth }} className="h-full rounded-full bg-f1-red" />
            </div>
          </div>

          <div className="flex h-full items-center">
            <motion.div ref={trackRef} style={{ x }} className="flex gap-6 pl-10 pr-16">
              {LEGENDS.map((l, i) => (
                <BigPoster key={l.ref} legend={l} index={i} />
              ))}
              <RailEndCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* mobile: native swipe row */}
      <section className="px-4 py-10 lg:hidden">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#FFD700]">The Immortals</p>
        <h2 className="mt-1 font-display text-2xl font-bold italic">Eleven Who Changed Everything</h2>
        <div className="mt-5 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3">
          {LEGENDS.map((l, i) => (
            <div key={l.ref} className="snap-start">
              <BigPoster legend={l} index={i} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function BigPoster({ legend: l, index }: { legend: Legend; index: number }) {
  const external = !l.eraData;
  const inner = (
    <div className="group relative h-[62vh] max-h-[560px] w-[300px] shrink-0 overflow-hidden rounded-card border border-white/10 bg-carbon-850 shadow-2xl transition-[border-color,box-shadow] duration-500 hover:border-[#FFD700]/50 hover:shadow-[0_0_50px_rgba(255,215,0,0.15)] lg:w-[340px]">
      <img
        src={l.portrait}
        alt={l.name}
        loading="lazy"
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1.5s] ease-out group-hover:scale-[1.06]",
          l.mono && "grayscale",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <span className="absolute left-5 top-5 font-display text-6xl font-bold italic text-white/20">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute right-4 top-5 flex items-center gap-1.5 rounded-full border border-[#FFD700]/40 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-[#FFD700] backdrop-blur">
        <Trophy className="h-3 w-3" /> {l.titles}×
      </span>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#FFD700]">
          {l.epithet}
        </p>
        <p className="mt-2 font-display text-3xl font-bold leading-[0.95] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          {l.name}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-widest text-silver">
          {l.nationality} · {l.years}
        </p>
        <p className="mt-3 max-h-0 overflow-hidden text-sm leading-relaxed text-silver opacity-0 transition-all duration-500 group-hover:max-h-28 group-hover:opacity-100">
          {l.bio}
        </p>
        <p className="mt-3 inline-flex translate-y-2 items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          Explore legacy <ArrowUpRight className="h-3.5 w-3.5" />
        </p>
      </div>
    </div>
  );
  return external ? (
    <a href={l.wiki} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link href={`/drivers/${l.ref}`}>{inner}</Link>
  );
}

function RailEndCard() {
  return (
    <Link
      href="/drivers"
      className="flex h-[62vh] max-h-[560px] w-[260px] shrink-0 flex-col items-center justify-center rounded-card border border-dashed border-white/15 text-center transition hover:border-f1-red/50"
    >
      <p className="font-display text-lg font-bold">The story continues</p>
      <p className="mt-2 max-w-[70%] text-xs text-muted">
        Explore every driver in the modern era, race by race.
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-f1-red">
        All drivers <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

/* ================================================================== */
/*  3 · Pinned quote — full-bleed, lines reveal on scroll             */
/* ================================================================== */

function PinnedQuote({ quote, image, mono = false }: { quote: (typeof QUOTES)[number]; image: string; mono?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.24]);
  // photo is always visible (never pure black), brightest through the middle
  const imgOpacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0.35, 0.7, 0.7, 0.4]);
  // reveal the quote and author early so there's little dead scroll
  const qOpacity = useTransform(scrollYProgress, [0.08, 0.28], [0, 1]);
  const qY = useTransform(scrollYProgress, [0.08, 0.28], [40, 0]);
  const aOpacity = useTransform(scrollYProgress, [0.32, 0.48], [0, 1]);

  return (
    <section ref={ref} className="relative h-[170vh]">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-black">
        <motion.img
          src={image}
          alt=""
          aria-hidden
          style={{ scale: imgScale, opacity: imgOpacity }}
          className={cn("absolute inset-0 h-full w-full object-cover", mono && "grayscale")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/70" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.p
            style={{ opacity: qOpacity, y: qY }}
            className="font-display text-3xl font-bold italic leading-tight text-white sm:text-5xl"
          >
            “{quote.text}”
          </motion.p>
          <motion.p
            style={{ opacity: aOpacity }}
            className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-[#FFD700]"
          >
            {quote.author}
          </motion.p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  4 · Legendary moments                                             */
/* ================================================================== */

function MomentsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#FFD700]">Folklore</p>
        <h2 className="mt-1 font-display text-3xl font-bold italic tracking-tight sm:text-4xl">
          Legendary Moments
        </h2>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MOMENTS.map((m, i) => (
          <MomentCard key={m.title} moment={m} index={i} />
        ))}
      </div>
    </section>
  );
}

function MomentCard({ moment: m, index }: { moment: (typeof MOMENTS)[number]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <motion.a
      ref={ref}
      href={m.wiki}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative block h-72 overflow-hidden rounded-card border border-white/8 transition-[border-color] duration-500 hover:border-f1-red/40"
    >
      <motion.img
        src={m.photo}
        alt={m.title}
        loading="lazy"
        style={{ y: imgY }}
        className="absolute inset-x-0 -inset-y-[8%] h-[116%] w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
      <span className="absolute right-4 top-3 font-display text-5xl font-bold italic text-white/25 transition-colors duration-500 group-hover:text-[#FFD700]/60">
        {m.year}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{m.title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-silver">{m.line}</p>
      </div>
    </motion.a>
  );
}

/* ================================================================== */
/*  5 · Decade timeline (interactive)                                 */
/* ================================================================== */

function Timeline() {
  const [active, setActive] = useState(DECADES.length - 1);
  const decade = DECADES[active];
  const featured = decade.featured.map((r) => LEGENDS.find((l) => l.ref === r)!).filter(Boolean);

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#FFD700]">The Timeline</p>
        <h2 className="mt-1 font-display text-3xl font-bold italic tracking-tight sm:text-4xl">
          Eight Decades of Speed
        </h2>
      </motion.div>

      <div className="overflow-hidden rounded-card border border-white/8 bg-carbon-900/60">
        <div className="flex gap-1 overflow-x-auto border-b border-white/5 p-2">
          {DECADES.map((d, i) => (
            <button
              key={d.label}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 font-display text-sm font-bold transition-colors",
                i === active ? "bg-f1-red text-white" : "text-muted hover:bg-white/5 hover:text-silver",
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
            transition={{ duration: 0.32 }}
            className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto]"
          >
            {featured[0] && (
              <img
                src={featured[0].portrait}
                alt=""
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 object-cover object-top opacity-[0.14] lg:block",
                  featured[0].mono && "grayscale",
                )}
                style={{ maskImage: "linear-gradient(270deg, black 30%, transparent 95%)", WebkitMaskImage: "linear-gradient(270deg, black 30%, transparent 95%)" }}
              />
            )}
            <div className="relative max-w-xl">
              <p className="font-display text-5xl font-bold italic text-white/10">{decade.label}</p>
              <h3 className="-mt-5 font-display text-2xl font-bold text-[#FFD700]/90">{decade.era}</h3>
              <p className="mt-3 text-sm leading-relaxed text-silver">{decade.blurb}</p>
            </div>
            <div className="relative flex gap-3">
              {featured.map((l) => {
                const inner = (
                  <div className="group w-36 overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-colors hover:border-[#FFD700]/40">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={l.portrait}
                        alt={l.name}
                        loading="lazy"
                        className={cn("h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105", l.mono && "grayscale")}
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-bold">{l.name}</p>
                      <p className="text-[10px] text-[#FFD700]">{l.titles}× champion</p>
                    </div>
                  </div>
                );
                return l.eraData ? (
                  <Link key={l.ref} href={`/drivers/${l.ref}`}>{inner}</Link>
                ) : (
                  <a key={l.ref} href={l.wiki} target="_blank" rel="noreferrer">{inner}</a>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  6 · Records — the exhibit hall (same data)                        */
/* ================================================================== */

function RecordsSection({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useHallOfFame>["data"];
  isLoading: boolean;
}) {
  return (
    <section className="pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#FFD700]">The Record Books</p>
        <h2 className="mt-2 font-display text-3xl font-bold uppercase italic tracking-tight sm:text-4xl">
          Where Numbers Become Monuments
        </h2>
        <p className="mt-2 text-sm text-muted">Modern-era leaders{data ? ` · ${data.seasons_covered}` : ""}</p>
      </motion.div>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h3 className="mb-4 font-display text-lg font-bold text-silver">Drivers</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.drivers.map((cat, i) => (
                <RecordCard key={cat.key} category={cat} kind="drivers" index={i} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-display text-lg font-bold text-silver">Constructors</h3>
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

function RecordCard({ category, kind, index }: { category: RecordCategory; kind: "drivers" | "constructors"; index: number }) {
  const max = Math.max(...category.entries.map((e) => e.value), 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group h-full rounded-card border border-white/8 bg-gradient-to-b from-carbon-800/60 to-carbon-900/80 p-5 transition-colors duration-500 hover:border-[#FFD700]/25"
    >
      <p className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {category.title}
        <span className="h-px w-10 bg-gradient-to-r from-[#FFD700]/60 to-transparent" />
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
  const barColor = leader ? "#FFD700" : entry.color ?? "#6a6a6a";

  const body = (
    <div className="flex items-center gap-3">
      <span className="w-5 text-center">
        {leader ? (
          <Crown className="mx-auto h-4 w-4 text-[#FFD700]" />
        ) : (
          <span className="font-display text-sm font-bold tabular-nums text-muted">{rank}</span>
        )}
      </span>
      {portrait ? (
        <span className={cn("h-9 w-9 shrink-0 overflow-hidden rounded-full", leader ? "ring-2 ring-[#FFD700]/70" : "ring-1 ring-white/15")}>
          <img src={portrait} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
        </span>
      ) : (
        <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: entry.color ?? "#3d3d3d" }} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", leader ? "font-semibold text-foreground" : "text-silver")}>{entry.label}</span>
          <span className={cn("shrink-0 font-display font-bold tabular-nums", leader ? "text-base text-[#FFD700]" : "text-sm text-silver")}>
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
