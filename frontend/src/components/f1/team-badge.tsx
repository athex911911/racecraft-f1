import { cn } from "@/lib/utils";
import type { Constructor } from "@/types/f1";

/**
 * Team logo on a light plate, ringed in the team colour — the same frame as the
 * dashboard championship cards. Falls back to a colour-block monogram when a team
 * has no logo, so it never depends on an external asset loading. Pass `className`
 * to resize (defaults to a 64px square).
 */
export function TeamBadge({
  constructor: c,
  className,
}: {
  constructor: Constructor;
  className?: string;
}) {
  const ring = c.color ?? "#3d3d3d";
  if (c.logo_url) {
    return (
      <span
        className={cn(
          "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 p-2",
          className,
        )}
        style={{ boxShadow: `0 0 0 2px ${ring}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.logo_url}
          alt=""
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold text-white",
        className,
      )}
      style={{ background: ring }}
    >
      {c.name.slice(0, 3).toUpperCase()}
    </span>
  );
}
