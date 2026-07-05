import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

/** Compact KPI tile — big broadcast number, quiet label. Reused across pages. */
export function StatTile({ label, value, sub, accent = false, className }: StatTileProps) {
  return (
    <GlassCard className={cn("px-4 py-3.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-numeric text-[26px] font-bold tabular-nums leading-none",
          accent ? "text-f1-red" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[11px] text-silver">{sub}</p> : null}
    </GlassCard>
  );
}
