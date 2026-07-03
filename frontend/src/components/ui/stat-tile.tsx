import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

/** Compact KPI tile — big number, quiet label. Reused across analytics pages. */
export function StatTile({ label, value, sub, accent = false, className }: StatTileProps) {
  return (
    <GlassCard className={cn("px-4 py-3.5", className)}>
      <p className="text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-bold tabular-nums leading-none",
          accent ? "text-f1-red" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-[11px] text-silver">{sub}</p> : null}
    </GlassCard>
  );
}
