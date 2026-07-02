"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "./client";
import type {
  ChampionshipProgress,
  ConstructorStanding,
  DriverStanding,
  HealthStatus,
  NextRace,
  RaceSummary,
  SeasonProgress,
  TrendingStat,
} from "@/types/f1";

export function useDriverStandings(season = "current") {
  return useQuery({
    queryKey: ["driver-standings", season],
    queryFn: () => apiGet<DriverStanding[]>("/api/v1/standings/drivers", { season }),
  });
}

export function useConstructorStandings(season = "current") {
  return useQuery({
    queryKey: ["constructor-standings", season],
    queryFn: () =>
      apiGet<ConstructorStanding[]>("/api/v1/standings/constructors", { season }),
  });
}

export function useNextRace() {
  return useQuery({
    queryKey: ["next-race"],
    queryFn: () => apiGet<NextRace | null>("/api/v1/races/next"),
  });
}

export function useSeasonProgress(season = "current") {
  return useQuery({
    queryKey: ["season-progress", season],
    queryFn: () => apiGet<SeasonProgress>("/api/v1/seasons/progress", { season }),
  });
}

export function useChampionshipProgress(
  entityType: "driver" | "constructor",
  season = "current",
) {
  return useQuery({
    queryKey: ["championship-progress", entityType, season],
    queryFn: () =>
      apiGet<ChampionshipProgress>("/api/v1/analytics/championship-progress", {
        season,
        entity_type: entityType,
      }),
  });
}

export function useTrendingStats(season = "current") {
  return useQuery({
    queryKey: ["trending-stats", season],
    queryFn: () => apiGet<TrendingStat[]>("/api/v1/analytics/trending", { season }),
  });
}

export function useLatestRaceSummary() {
  return useQuery({
    queryKey: ["latest-race-summary"],
    queryFn: () => apiGet<RaceSummary | null>("/api/v1/races/latest/summary"),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthStatus>("/api/health"),
    refetchInterval: 60_000,
  });
}
