"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Driver } from "@/types/f1";

interface DriverAvatarProps {
  driver: Driver;
  teamColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "h-8 w-8 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-16 w-16 text-lg" };

/**
 * Driver photo (Wikipedia lead image), ringed with the team colour. Falls back to
 * an initials chip when there's no headshot or the image fails to load — so it
 * never depends on an external asset being reachable.
 */
export function DriverAvatar({ driver, teamColor, size = "md", className }: DriverAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(driver.headshot_url) && !failed;

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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-carbon-600 font-display font-bold text-silver",
        SIZES[size],
        className,
      )}
      style={{ boxShadow: `0 0 0 2px ${teamColor ?? "#3d3d3d"}` }}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={driver.headshot_url as string}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        initials
      )}
    </div>
  );
}
