"use client";

import { useState } from "react";

import { cn, hiResPhoto } from "@/lib/utils";
import type { Driver } from "@/types/f1";

interface DriverPhotoTileProps {
  driver: Driver;
  teamColor?: string | null;
  className?: string;
  /** overlaid at the bottom of the tile (name, stats, …) */
  children?: React.ReactNode;
}

/**
 * A large still-portrait tile whose *border* is alive: a team-coloured light
 * beam sweeps continuously around the edge (see `.tile-frame` in globals.css)
 * while the photo itself stays perfectly still. Falls back to an initials block
 * when there's no headshot, and never shows a broken image (onError fallback).
 */
export function DriverPhotoTile({ driver, teamColor, className, children }: DriverPhotoTileProps) {
  const color = teamColor ?? "#3d3d3d";
  const [photoFailed, setPhotoFailed] = useState(false);
  const src = driver.headshot_url ? hiResPhoto(driver.headshot_url) : null;
  const showPhoto = Boolean(src) && !photoFailed;

  const initials =
    driver.code ??
    driver.full_name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 3)
      .join("")
      .toUpperCase();

  return (
    <div
      className={cn("tile-frame rounded-card rounded-tr-none", className)}
      style={{ "--tile-accent": color } as React.CSSProperties}
    >
      <div className="tile-inner">
        {showPhoto ? (
          <>
            {/* blurred fill so the portrait is never cropped, yet no dead bars */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src as string}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
            />
            <div className="absolute inset-0 bg-black/25" aria-hidden />
            {/* the full, uncropped portrait — always in frame */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src as string}
              alt={driver.full_name}
              onError={() => setPhotoFailed(true)}
              className="absolute inset-0 h-full w-full object-contain object-bottom"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-carbon-700">
            <span className="font-display text-7xl font-bold italic text-white/20">{initials}</span>
          </div>
        )}

        {/* team-colour wash from the top + bottom legibility scrim */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-25"
          style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        {children ? <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">{children}</div> : null}
      </div>
    </div>
  );
}
