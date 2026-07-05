"use client";

import { CalendarDays, GitCompareArrows, Globe2, History, Sparkles } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";

const ACTIONS = [
  {
    href: "/compare",
    label: "Compare Drivers",
    desc: "Head-to-head radar & stats",
    icon: GitCompareArrows,
  },
  {
    href: "/predictor",
    label: "Race Predictor",
    desc: "ML win & podium probability",
    icon: Sparkles,
  },
  { href: "/circuits", label: "Explore Circuits", desc: "Every track, mapped", icon: Globe2 },
  { href: "/history", label: "Historical Explorer", desc: "Results back to 1950", icon: History },
  { href: "/calendar", label: "Race Calendar", desc: "Full season schedule", icon: CalendarDays },
];

export function QuickActions() {
  return (
    <section>
      <SectionHeading title="Quick Actions" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {ACTIONS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <GlassCard hover className="group relative h-full overflow-hidden p-5">
              {/* red racing line sweeps in on hover */}
              <span
                className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-f1-red to-transparent transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-f1-red/10 ring-1 ring-f1-red/25 transition group-hover:bg-f1-red/20">
                <Icon className="h-5 w-5 text-f1-red transition-transform duration-300 group-hover:scale-110" />
              </span>
              <p className="mt-3.5 text-sm font-semibold">{label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
