"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DriverCard } from "@/components/drivers/driver-card";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useDrivers } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

type Scope = "current" | "all";

export default function DriversPage() {
  const [scope, setScope] = useState<Scope>("current");
  const [query, setQuery] = useState("");
  const { data, isLoading } = useDrivers(scope);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (d) =>
        d.driver.full_name.toLowerCase().includes(q) ||
        (d.constructor?.name.toLowerCase().includes(q) ?? false) ||
        (d.driver.code?.toLowerCase().includes(q) ?? false),
    );
  }, [data, query]);

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        title="Drivers"
        subtitle={
          scope === "current"
            ? "Every driver on this season's grid — ranked by points"
            : "All-time career leaders across ingested seasons"
        }
        action={
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(
              [
                ["current", "This Season"],
                ["all", "All-Time"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                  scope === value ? "bg-f1-red text-white" : "text-silver hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drivers or teams…"
          className="w-full rounded-lg border border-white/10 bg-carbon-800/60 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-f1-red/50 focus:outline-none focus:ring-1 focus:ring-f1-red/30"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="py-16 text-center text-sm text-muted">
          No drivers match “{query}”.
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <DriverCard key={item.driver.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
