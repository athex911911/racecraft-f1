"use client";

import Link from "next/link";

import { useConstructors } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import type { Constructor } from "@/types/f1";

/**
 * Transparent marquee ribbon: the current grid's team logos drift right-to-left
 * in championship order, pausing on hover. Logos sit on small light plates so
 * dark wordmarks stay legible on the dark theme; teams without a free logo get
 * their monogram in team colours. Each mark links to the team page.
 */
export function TeamRibbon({ className }: { className?: string }) {
  const { data } = useConstructors();
  const teams = data?.map((t) => t.constructor) ?? [];

  return (
    <div
      className={cn("relative h-12 overflow-hidden", className)}
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
      }}
      aria-label="Teams on the grid"
    >
      {teams.length > 0 && (
        <div className="flex h-full w-max animate-marquee items-center hover:[animation-play-state:paused] motion-reduce:animate-none">
          <RibbonRow teams={teams} />
          <RibbonRow teams={teams} ariaHidden />
        </div>
      )}
    </div>
  );
}

/** One copy of the logo row; the marquee shows two back-to-back for a seamless loop. */
function RibbonRow({ teams, ariaHidden = false }: { teams: Constructor[]; ariaHidden?: boolean }) {
  return (
    <div className="flex items-center gap-12 pr-12" aria-hidden={ariaHidden || undefined}>
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/constructors/${team.constructor_ref}`}
          tabIndex={ariaHidden ? -1 : undefined}
          className="flex shrink-0 items-center gap-2.5 opacity-75 transition-opacity hover:opacity-100"
        >
          {team.logo_url ? (
            <span className="flex h-9 w-20 items-center justify-center overflow-hidden rounded-md bg-white/90 px-1.5 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.logo_url}
                alt=""
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </span>
          ) : (
            <span
              className="flex h-9 w-20 items-center justify-center rounded-md font-display text-xs font-bold text-white"
              style={{ background: `${team.color ?? "#3d3d3d"}33`, boxShadow: `inset 0 0 0 1.5px ${team.color ?? "#3d3d3d"}` }}
            >
              {monogram(team.name)}
            </span>
          )}
          <span className="text-xs font-semibold text-silver">{team.name}</span>
        </Link>
      ))}
    </div>
  );
}

function monogram(name: string): string {
  const filler = /^(f1|team|racing|formula|one|f\d)$/i;
  const words = name.split(/\s+/).filter((w) => !filler.test(w));
  const base = words.length ? words : name.split(/\s+/);
  return base.length === 1
    ? base[0].slice(0, 3).toUpperCase()
    : base.map((w) => w[0]).slice(0, 3).join("").toUpperCase();
}
