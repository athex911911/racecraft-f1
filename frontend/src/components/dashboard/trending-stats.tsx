"use client";

import { motion } from "framer-motion";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrendingStats } from "@/lib/api/hooks";

export function TrendingStats() {
  const { data, isLoading } = useTrendingStats();

  return (
    <section>
      <SectionHeading title="Trending Statistics" subtitle="Season leaders across key metrics" />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data?.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <GlassCard hover className="relative overflow-hidden p-4">
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: stat.color ?? "#3d3d3d" }}
                  aria-hidden
                />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold">{stat.value}</p>
                <p className="mt-0.5 truncate text-sm text-silver">{stat.holder}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
