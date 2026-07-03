"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useDriverStandings, useTrendingStats } from "@/lib/api/hooks";

export function TrendingStats() {
  const { data, isLoading } = useTrendingStats();
  // reuse the standings cache to decorate each stat with its holder's photo
  const standings = useDriverStandings();
  const photoByName = useMemo(
    () =>
      new Map(
        (standings.data ?? []).map((s) => [s.driver.full_name, s.driver.headshot_url]),
      ),
    [standings.data],
  );

  return (
    <section>
      <SectionHeading title="Season Highlights" subtitle="Season leaders across key metrics" />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data?.map((stat, i) => {
            const photo = photoByName.get(stat.holder);
            const color = stat.color ?? "#3d3d3d";
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <GlassCard hover className="group relative h-36 overflow-hidden p-4">
                  {/* team-colour wash + spine */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.10]"
                    style={{ background: `linear-gradient(120deg, ${color}, transparent 55%)` }}
                    aria-hidden
                  />
                  <span
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: color }}
                    aria-hidden
                  />
                  {/* the stat holder, editorial-style */}
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute -right-1 bottom-0 h-[112%] w-24 object-cover object-top opacity-70 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-90"
                      style={{
                        maskImage: "linear-gradient(270deg, black 55%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(270deg, black 55%, transparent 100%)",
                      }}
                    />
                  )}
                  <div className="relative flex h-full flex-col">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                      {stat.label}
                    </p>
                    <p className="mt-auto font-display text-4xl font-bold leading-none">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 truncate pr-20 text-sm font-medium text-silver">
                      {stat.holder}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
