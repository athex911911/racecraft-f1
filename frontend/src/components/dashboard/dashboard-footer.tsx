"use client";

import { useHealth, useSeasonProgress } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

export function DashboardFooter() {
  const { data: health, isError } = useHealth();
  const { data: progress } = useSeasonProgress();
  const apiUp = !isError && health?.status === "ok";
  const dbUp = health?.database === "up";

  return (
    <footer className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-5 text-xs text-muted sm:flex-row sm:items-center">
      <p>
        Racecraft · <span className="font-semibold text-silver">athex</span>
      </p>
      <div className="flex items-center gap-4">
        {progress && (
          <span>
            {progress.season} · {progress.completed_rounds}/{progress.total_rounds} rounds
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", apiUp ? "bg-success" : "bg-danger")} />
          API
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", dbUp ? "bg-success" : "bg-danger")} />
          Database
        </span>
      </div>
    </footer>
  );
}
