"use client";

import { useHealth } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

export function HealthDot({ collapsed }: { collapsed?: boolean }) {
  const { data, isError } = useHealth();
  const up = !isError && data?.status === "ok";
  return (
    <div className="flex items-center gap-2" title={up ? "API & database online" : "API offline"}>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          up ? "bg-success" : "bg-danger",
        )}
      />
      {!collapsed && (
        <span className="text-[11px] text-muted">
          {up ? `API v${data?.version} · DB ${data?.database}` : "API offline"}
        </span>
      )}
    </div>
  );
}
