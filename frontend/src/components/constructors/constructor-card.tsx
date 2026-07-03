import Link from "next/link";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { countryFlag, formatPoints } from "@/lib/utils";
import type { ConstructorListItem } from "@/types/f1";

export function ConstructorCard({ item }: { item: ConstructorListItem }) {
  const { constructor: c } = item;
  const color = c.color ?? "#3d3d3d";

  return (
    <Link href={`/constructors/${c.constructor_ref}`} className="group block">
      <GlassCard hover className="relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-30"
          style={{ background: color }}
          aria-hidden
        />
        <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} aria-hidden />

        {item.championship_position ? (
          <span className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-display text-xs font-bold text-silver">
            P{item.championship_position}
          </span>
        ) : null}

        <div className="pl-2">
          <p className="pr-10 font-display text-lg font-bold leading-tight">{c.name}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            {countryFlag(c.nationality)} {c.nationality ?? "—"}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              {item.drivers.slice(0, 4).map((d) => (
                <DriverAvatar key={d.id} driver={d} teamColor={color} size="sm" />
              ))}
            </div>
            <span className="truncate text-xs text-silver">
              {item.drivers.map((d) => d.code ?? d.full_name.split(" ").at(-1)).join(" · ")}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <Metric label="Wins" value={item.wins} />
              <Metric label="Podiums" value={item.podiums} />
              <Metric label="Poles" value={item.poles} />
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {formatPoints(item.points)}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted">pts</p>
            </div>
          </div>
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
