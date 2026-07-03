import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";
import { CIRCUIT_IMAGES } from "@/lib/design/images";
import { countryFlag } from "@/lib/utils";
import type { CircuitListItem } from "@/types/f1";

export function CircuitCard({ item }: { item: CircuitListItem }) {
  const { circuit: c } = item;
  const art = CIRCUIT_IMAGES[c.circuit_ref];

  return (
    <Link href={`/circuits/${c.circuit_ref}`} className="group block">
      <GlassCard hover className="relative h-52 overflow-hidden p-4">
        {/* white-line track art */}
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute -bottom-8 -right-6 h-[105%] max-w-none opacity-[0.16] transition duration-500 group-hover:scale-[1.04] group-hover:opacity-25"
            style={{
              filter: "invert(1) grayscale(1)",
              maskImage: "linear-gradient(250deg, black 40%, transparent 85%)",
              WebkitMaskImage: "linear-gradient(250deg, black 40%, transparent 85%)",
            }}
          />
        ) : (
          <span
            className="pointer-events-none absolute -bottom-4 -right-2 text-[7rem] leading-none opacity-[0.14]"
            aria-hidden
          >
            {countryFlag(c.country) ?? "🏁"}
          </span>
        )}

        {item.on_current_calendar ? (
          <span className="absolute right-3 top-3 rounded-full bg-f1-red/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-f1-red ring-1 ring-f1-red/30">
            2026
          </span>
        ) : null}

        <div className="relative flex h-full flex-col">
          <p className="pr-14 font-display text-lg font-bold leading-tight">
            {countryFlag(c.country)} {c.name}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted">
            {[c.location, c.country].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-auto">
            {item.last_winner ? (
              <p className="mb-2 truncate text-xs text-silver">
                Last winner <span className="font-semibold text-foreground">{item.last_winner}</span>
              </p>
            ) : (
              <p className="mb-2 text-xs italic text-muted">Debuts this season</p>
            )}
            <div className="flex gap-4 border-t border-white/5 pt-2.5 text-center">
              <Metric label="Length" value={c.length_km ? `${c.length_km} km` : "—"} />
              <Metric label="Corners" value={c.corners ?? "—"} />
              <Metric label="GPs held" value={item.races_held} />
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-display text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}
