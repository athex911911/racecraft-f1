import { cn } from "@/lib/utils";
import type { Driver } from "@/types/f1";

interface DriverAvatarProps {
  driver: Driver;
  teamColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "h-8 w-8 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-16 w-16 text-lg" };

/** Initials avatar ringed with the team color (no reliance on external photos). */
export function DriverAvatar({ driver, teamColor, size = "md", className }: DriverAvatarProps) {
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
        "flex shrink-0 items-center justify-center rounded-full bg-carbon-600 font-display font-bold text-silver",
        SIZES[size],
        className,
      )}
      style={{ boxShadow: `0 0 0 2px ${teamColor ?? "#3d3d3d"}` }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
