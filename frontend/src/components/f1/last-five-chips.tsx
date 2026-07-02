import { cn } from "@/lib/utils";

/** Compact last-N finish chips: P1 gold-ish, podium green, points silver, DNF red. */
export function LastFiveChips({ results }: { results: string[] }) {
  return (
    <div className="flex gap-1">
      {results.map((r, i) => {
        const n = Number(r);
        const finished = Number.isFinite(n) && n > 0;
        return (
          <span
            key={i}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold tabular-nums",
              finished && n === 1 && "bg-f1-red text-white",
              finished && n > 1 && n <= 3 && "bg-success/20 text-success",
              finished && n > 3 && n <= 10 && "bg-white/10 text-silver",
              finished && n > 10 && "bg-white/5 text-muted",
              !finished && "bg-danger/15 text-danger",
            )}
            title={finished ? `P${n}` : r}
          >
            {finished ? n : "×"}
          </span>
        );
      })}
    </div>
  );
}
