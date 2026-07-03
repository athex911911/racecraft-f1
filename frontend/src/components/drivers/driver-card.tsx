import Link from "next/link";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { formatPoints, nationalityFlag } from "@/lib/utils";
import type { DriverListItem } from "@/types/f1";

export function DriverCard({ item }: { item: DriverListItem }) {
  const { driver, constructor } = item;
  const teamColor = constructor?.color ?? "#3d3d3d";

  return (
    <Link href={`/drivers/${driver.driver_ref}`} className="group block">
      <GlassCard hover className="relative overflow-hidden p-4">
        {/* team-color spine */}
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: teamColor }}
          aria-hidden
        />
        <div className="flex items-center gap-3 pl-2">
          <DriverAvatar driver={driver} teamColor={constructor?.color} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">
              {nationalityFlag(driver.nationality)} {driver.full_name}
            </p>
            <p className="truncate text-[11px] text-muted">
              {constructor?.name ?? "—"}
              {driver.number ? ` · #${driver.number}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold tabular-nums leading-none">
              {formatPoints(item.points)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted">pts</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
          <Metric label="Wins" value={item.wins} />
          <Metric label="Podiums" value={item.podiums} />
          <Metric label="Poles" value={item.poles} />
        </div>
      </GlassCard>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}
