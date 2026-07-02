"use client";

import {
  CalendarDays,
  GitCompareArrows,
  Globe2,
  History,
  Sparkles,
  Trophy,
} from "lucide-react";
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
  { href: "/hall-of-fame", label: "Hall of Fame", desc: "All-time records", icon: Trophy },
];

export function QuickActions() {
  return (
    <section>
      <SectionHeading title="Quick Actions" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {ACTIONS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <GlassCard hover className="group h-full p-4">
              <Icon className="h-5 w-5 text-f1-red transition-transform group-hover:scale-110" />
              <p className="mt-3 text-sm font-semibold">{label}</p>
              <p className="mt-0.5 text-xs text-muted">{desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
