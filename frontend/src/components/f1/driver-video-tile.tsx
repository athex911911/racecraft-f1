"use client";

import { useState } from "react";

import { DRIVER_VIDEOS } from "@/lib/design/images";
import { cn } from "@/lib/utils";
import type { Driver } from "@/types/f1";

interface DriverVideoTileProps {
  driver: Driver;
  teamColor?: string | null;
  className?: string;
  /** overlaid at the bottom of the tile (name, stats, …) */
  children?: React.ReactNode;
}

/**
 * A living portrait tile for a driver, three graceful tiers:
 *   1. a real muted/looping <video> when a curated clip exists (DRIVER_VIDEOS),
 *   2. else the driver's headshot with a slow cinematic pan (reads as motion),
 *   3. else an initials block.
 * Every tier fails forward via onError, so the tile never shows a broken asset.
 */
export function DriverVideoTile({ driver, teamColor, className, children }: DriverVideoTileProps) {
  const color = teamColor ?? "#3d3d3d";
  const videoUrl = DRIVER_VIDEOS[driver.driver_ref];

  const [videoFailed, setVideoFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const showVideo = Boolean(videoUrl) && !videoFailed;
  const showPhoto = !showVideo && Boolean(driver.headshot_url) && !photoFailed;

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
      className={cn(
        "group relative overflow-hidden rounded-card rounded-tr-none border border-white/8 bg-carbon-850",
        className,
      )}
    >
      {/* team-colour top strip */}
      <span className="absolute inset-x-0 top-0 z-20 h-1" style={{ background: color }} aria-hidden />

      {showVideo ? (
        <video
          src={videoUrl}
          poster={driver.headshot_url ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={driver.headshot_url as string}
          alt={driver.full_name}
          onError={() => setPhotoFailed(true)}
          className="motion-pan absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-carbon-700">
          <span className="font-display text-6xl font-bold italic text-white/20">{initials}</span>
        </div>
      )}

      {/* team-colour wash from the top + bottom legibility scrim */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-25"
        style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      {/* broadcast-style LIVE flag when it's genuine footage */}
      {showVideo && (
        <span className="absolute right-2.5 top-3 z-20 flex items-center gap-1.5 rounded bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-f1-red" /> Live
        </span>
      )}

      {children ? <div className="absolute inset-x-0 bottom-0 z-10 p-4">{children}</div> : null}
    </div>
  );
}
