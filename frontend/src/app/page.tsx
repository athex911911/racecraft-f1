import type { Metadata } from "next";

import { ChampionshipChart } from "@/components/dashboard/championship-chart";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { Hero } from "@/components/dashboard/hero";
import { LatestRaceSummary } from "@/components/dashboard/latest-race-summary";
import { NextRaceCard } from "@/components/dashboard/next-race-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Standings } from "@/components/dashboard/standings";
import { TeamRibbon } from "@/components/dashboard/team-ribbon";
import { TrendingStats } from "@/components/dashboard/trending-stats";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <Hero />
      <div className="grid gap-10 2xl:grid-cols-[1.5fr_1fr] 2xl:gap-6">
        <Standings />
        {/* between Standings and Next GP when stacked; full-width row below the pair at 2xl */}
        <TeamRibbon className="2xl:order-3 2xl:col-span-2" />
        <NextRaceCard />
      </div>
      <ChampionshipChart />
      <TrendingStats />
      <LatestRaceSummary />
      <QuickActions />
      <DashboardFooter />
    </div>
  );
}
