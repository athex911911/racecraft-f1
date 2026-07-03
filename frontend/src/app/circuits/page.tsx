"use client";

import { motion } from "framer-motion";
import { Globe2, LayoutGrid, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { CircuitCard } from "@/components/circuits/circuit-card";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useCircuits } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const WorldMap = dynamic(
  () => import("@/components/circuits/world-map").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

type Scope = "calendar" | "all";
type View = "grid" | "map";

export default function CircuitsPage() {
  const [scope, setScope] = useState<Scope>("calendar");
  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const { data, isLoading } = useCircuits();

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((c) =>
      `${c.circuit.name} ${c.circuit.location ?? ""} ${c.circuit.country ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  const filtered = useMemo(
    () => (scope === "calendar" ? searched.filter((c) => c.on_current_calendar) : searched),
    [searched, scope],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        title="Circuits"
        subtitle={
          scope === "calendar"
            ? "Every track on the 2026 calendar"
            : "Every circuit in the ingested history"
        }
        action={
          <div className="flex items-center gap-2">
            {view === "grid" && (
              <div className="flex rounded-lg border border-white/10 p-0.5">
                {(
                  [
                    ["calendar", "2026 Calendar"],
                    ["all", "All Circuits"],
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
            )}
            <div className="flex rounded-lg border border-white/10 p-0.5">
              {(
                [
                  ["grid", LayoutGrid],
                  ["map", Globe2],
                ] as const
              ).map(([value, Icon]) => (
                <button
                  key={value}
                  onClick={() => setView(value)}
                  aria-label={`${value} view`}
                  className={cn(
                    "rounded-md p-1.5 transition",
                    view === value ? "bg-f1-red text-white" : "text-silver hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search circuits, cities or countries…"
          className="w-full rounded-lg border border-white/10 bg-carbon-800/60 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-f1-red/50 focus:outline-none focus:ring-1 focus:ring-f1-red/30"
        />
      </div>

      {view === "map" ? (
        <GlassCard className="h-[600px] overflow-hidden p-0">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <WorldMap circuits={searched} />
          )}
        </GlassCard>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="py-16 text-center text-sm text-muted">
          No circuits match “{query}”.
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.circuit.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4), ease: "easeOut" }}
            >
              <CircuitCard item={item} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
