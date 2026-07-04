"use client";

import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ChevronDown, Crown, Flag, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useHallOfFame } from "@/lib/api/hooks";
import { CHAPTERS, RECORD_PORTRAITS, type Achievement, type Chapter } from "@/lib/design/legends";
import { cn } from "@/lib/utils";
import type { RecordCategory, RecordEntry } from "@/types/f1";

/* ================================================================== */
/*  Page — a scrolling documentary                                    */
/* ================================================================== */

export default function HallOfFamePage() {
  const { data, isLoading } = useHallOfFame();

  return (
    <div className="-mx-4 -my-6 bg-[#070606] sm:-mx-6 lg:-mx-8">
      <Particles />
      <Intro />
      {CHAPTERS.map((c, i) => (
        <div key={c.ref}>
          <RacingLine era={c.era} title={c.eraTitle} flip={i % 2 === 1} />
          <ChapterSection chapter={c} index={i} />
        </div>
      ))}
      <FinishLine />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <HallOfRecords data={data} isLoading={isLoading} />
        <p className="mt-10 text-center text-[11px] text-muted">
          Career achievements above are all-time records. The statistics in the Hall of Records are
          computed from the ingested era{data ? ` (${data.seasons_covered})` : ""}.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Ambient — drifting particles (very subtle)                        */
/* ================================================================== */

function Particles() {
  const dots = Array.from({ length: 22 });
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {dots.map((_, i) => {
        const left = (i * 47) % 100;
        const size = 1 + (i % 3);
        const dur = 14 + (i % 7) * 3;
        const delay = (i % 5) * 2;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{ left: `${left}%`, width: size, height: size }}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.5, 0] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Intro                                                             */
/* ================================================================== */

function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const cue = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section ref={ref} className="relative flex h-screen items-center justify-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 50% 40%, rgba(225,6,0,0.10), transparent 70%)" }}
        aria-hidden
      />
      <motion.div style={{ y, opacity }} className="relative z-10 px-6 text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.5em] text-[#FFD700]">
          <Trophy className="h-4 w-4" /> Hall of Fame
        </p>
        <h1 className="mt-6 font-display text-5xl font-bold uppercase italic leading-[0.95] tracking-tight sm:text-8xl">
          The Legends Who
          <br />
          Built <span className="text-f1-red">Formula One</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-silver sm:text-base">
          Six drivers. Six eras. One story. Scroll through the careers, the numbers and the moments
          of the men who defined the fastest sport on earth.
        </p>
      </motion.div>
      <motion.div style={{ opacity: cue }} className="absolute bottom-10 flex flex-col items-center gap-2 text-muted">
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em]">Scroll to begin the journey</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/*  Racing-line transition — the line draws, a car follows, era name  */
/* ================================================================== */

function RacingLine({ era, title, flip }: { era: string; title: string; flip: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const draw = useTransform(scrollYProgress, [0.12, 0.78], [0, 1]);
  const carOpacity = useTransform(scrollYProgress, [0.1, 0.18, 0.74, 0.85], [0, 1, 1, 0]);
  const labelOpacity = useTransform(scrollYProgress, [0.32, 0.46, 0.64, 0.78], [0, 1, 1, 0]);
  const labelY = useTransform(scrollYProgress, [0.32, 0.5], [18, 0]);

  const carX = useMotionValue(40);
  const carY = useMotionValue(150);
  const carR = useMotionValue(0);

  // a winding, circuit-like path
  const PATH = flip
    ? "M40,150 C 220,300 340,40 520,150 S 820,60 960,180"
    : "M40,150 C 220,20 340,300 520,150 S 820,260 960,110";

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const path = pathRef.current;
      if (!path) return;
      const t = Math.max(0, Math.min(1, (v - 0.12) / 0.66));
      const len = path.getTotalLength();
      const p = path.getPointAtLength(t * len);
      const p2 = path.getPointAtLength(Math.min(t * len + 1.5, len));
      carX.set(p.x);
      carY.set(p.y);
      carR.set((Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI);
    });
    return unsub;
  }, [scrollYProgress, carX, carY, carR]);

  return (
    <div ref={ref} className="relative h-[70vh]">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <svg viewBox="0 0 1000 300" className="w-[92%] max-w-4xl overflow-visible">
          <defs>
            <filter id="lineglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* ghost track */}
          <path d={PATH} fill="none" stroke="#1a1a1a" strokeWidth={3} strokeLinecap="round" />
          {/* glowing racing line drawing in */}
          <motion.path
            ref={pathRef}
            d={PATH}
            fill="none"
            stroke="#E10600"
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#lineglow)"
            style={{ pathLength: draw }}
          />
          {/* the car */}
          <motion.g style={{ x: carX, y: carY, rotate: carR, opacity: carOpacity }}>
            <circle r={11} fill="#E10600" opacity={0.35} filter="url(#lineglow)" />
            <rect x={-9} y={-3} width={18} height={6} rx={3} fill="#f5f5f5" />
            <rect x={-11} y={-1.5} width={3} height={3} rx={1} fill="#111" />
            <rect x={8} y={-1.5} width={3} height={3} rx={1} fill="#111" />
            <rect x={7} y={-2.6} width={4} height={5.2} rx={1} fill="#E10600" />
          </motion.g>
        </svg>

        <motion.div
          style={{ opacity: labelOpacity, y: labelY }}
          className="pointer-events-none absolute inset-x-0 top-[26%] text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.5em] text-[#FFD700]">{era}</p>
          <p className="mt-2 font-display text-2xl font-bold italic tracking-tight text-foreground/90 sm:text-4xl">
            {title}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Driver chapter — one legend owns the screen                       */
/* ================================================================== */

function ChapterSection({ chapter: c, index }: { chapter: Chapter; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const reverse = index % 2 === 1;

  const contentOpacity = useTransform(scrollYProgress, [0, 0.08, 0.93, 1], [0, 1, 1, 0]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const portraitScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.05, 1, 1.05]);
  const nameX = useTransform(scrollYProgress, [0, 0.14], [reverse ? 48 : -48, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const quoteOpacity = useTransform(scrollYProgress, [0.68, 0.8], [0, 1]);
  const quoteY = useTransform(scrollYProgress, [0.68, 0.8], [24, 0]);

  const A_START = 0.26;
  const A_END = 0.66;
  const step = (A_END - A_START) / c.achievements.length;

  const Cta = c.eraData ? Link : "a";
  const ctaProps = c.eraData
    ? { href: `/drivers/${c.ref}` }
    : { href: c.wiki, target: "_blank", rel: "noreferrer" };

  return (
    <section ref={ref} className="relative h-[175vh]">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* faint action-photo backdrop with parallax */}
        <motion.img
          src={c.action}
          alt=""
          aria-hidden
          style={{ y: bgY }}
          className="absolute inset-x-0 -inset-y-[6%] h-[112%] w-full object-cover opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070606] via-[#070606]/70 to-[#070606]" />
        <div
          className="absolute inset-0"
          style={{ background: reverse
            ? "radial-gradient(45% 55% at 80% 50%, rgba(225,6,0,0.10), transparent 70%)"
            : "radial-gradient(45% 55% at 20% 50%, rgba(225,6,0,0.10), transparent 70%)" }}
          aria-hidden
        />

        <motion.div
          style={{ opacity: contentOpacity }}
          className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-6 px-6 lg:flex-row lg:gap-14 lg:px-12"
        >
          {/* portrait — ~45% */}
          <motion.div
            style={{ y: portraitY, scale: portraitScale }}
            className={cn("relative hidden h-[56vh] w-[40%] shrink-0 lg:block", reverse ? "lg:order-2" : "lg:order-1")}
          >
            <img
              src={c.portrait}
              alt={`${c.first} ${c.last}`}
              className="h-full w-full object-cover object-top"
              style={{
                maskImage: "radial-gradient(120% 78% at 50% 42%, black 52%, transparent 92%)",
                WebkitMaskImage: "radial-gradient(120% 78% at 50% 42%, black 52%, transparent 92%)",
              }}
            />
          </motion.div>

          {/* content */}
          <div className={cn("w-full lg:flex-1", reverse ? "lg:order-1" : "lg:order-2")}>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-[#FFD700]">
              <span className="h-px w-8 bg-[#FFD700]/60" /> {c.era} · {c.eraTitle}
            </p>
            <motion.h2
              style={{ x: nameX }}
              className="mt-2 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight sm:text-6xl"
            >
              {c.first} <span className="text-f1-red">{c.last}</span>
            </motion.h2>
            <p className="mt-1.5 text-xs uppercase tracking-[0.2em] text-silver">
              {c.nationality} · {c.years} · <span className="text-[#FFD700]/90">{c.epithet}</span>
            </p>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-silver">{c.bio}</p>

            <ul className="mt-4 space-y-1.5">
              {c.achievements.map((a, i) => (
                <AchievementRow
                  key={a.label}
                  progress={scrollYProgress}
                  from={A_START + i * step}
                  to={A_START + i * step + step * 0.85}
                  achievement={a}
                />
              ))}
            </ul>

            <motion.blockquote
              style={{ opacity: quoteOpacity, y: quoteY }}
              className="mt-4 border-l-2 border-f1-red/60 pl-4 font-display text-base font-semibold italic text-foreground/90 sm:text-lg"
            >
              “{c.quote}”
            </motion.blockquote>

            <Cta
              {...ctaProps}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:text-f1-red"
            >
              {c.eraData ? "Explore the full career" : "Read the story"}
              <span aria-hidden>→</span>
            </Cta>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AchievementRow({
  progress,
  from,
  to,
  achievement: a,
}: {
  progress: MotionValue<number>;
  from: number;
  to: number;
  achievement: Achievement;
}) {
  const opacity = useTransform(progress, [from, to], [0, 1]);
  const x = useTransform(progress, [from, to], [-24, 0]);
  return (
    <motion.li style={{ opacity, x }} className="flex items-baseline gap-2.5">
      <Trophy className="h-3 w-3 shrink-0 translate-y-0.5 text-[#FFD700]" />
      <span>
        <span className="font-display text-base font-bold">{a.label}</span>
        {a.sub ? <span className="ml-2 text-[11px] text-muted">{a.sub}</span> : null}
      </span>
    </motion.li>
  );
}

/* ================================================================== */
/*  Finish line → Hall of Records                                     */
/* ================================================================== */

function FinishLine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.2, 0.6], [0.9, 1]);

  return (
    <div ref={ref} className="relative flex h-[70vh] items-center justify-center">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 opacity-[0.08]"
        style={{
          backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <motion.div style={{ opacity, scale }} className="relative text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.5em] text-[#FFD700]">
          <Flag className="h-4 w-4" /> The Chequered Flag
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold uppercase italic tracking-tight sm:text-6xl">
          Hall of Records
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Every legend leaves a number behind. These are the marks that still stand in the modern era.
        </p>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Hall of Records — the existing data                               */
/* ================================================================== */

function HallOfRecords({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useHallOfFame>["data"];
  isLoading: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-10">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-[#FFD700]">Drivers</p>
        <p className="mb-5 text-sm text-muted">Modern-era leaders · {data.seasons_covered}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.drivers.map((cat, i) => (
            <RecordCard key={cat.key} category={cat} kind="drivers" index={i} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#FFD700]">Constructors</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.constructors.map((cat, i) => (
            <RecordCard key={cat.key} category={cat} kind="constructors" index={i} />
          ))}
        </div>
      </div>
    </div>
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
