import Link from "next/link";

import { CIRCUIT_IMAGES, CIRCUIT_PHOTOS } from "@/lib/design/images";
import { countryFlag } from "@/lib/utils";
import type { CircuitListItem } from "@/types/f1";

export function CircuitCard({ item }: { item: CircuitListItem }) {
  const { circuit: c } = item;
  const photo = CIRCUIT_PHOTOS[c.circuit_ref];
  const trackArt = CIRCUIT_IMAGES[c.circuit_ref];

  return (
    <Link href={`/circuits/${c.circuit_ref}`} className="group block">
      <div className="relative h-64 overflow-hidden rounded-card rounded-tr-none border border-white/8 bg-carbon-850 transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,0.7,0.2,1)] will-change-transform group-hover:-translate-y-1.5 group-hover:border-f1-red group-hover:shadow-[0_22px_44px_-18px_rgba(0,0,0,0.85),0_14px_46px_-18px_rgba(255,24,1,0.22)]">
        {/* the track, for real */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={c.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          />
        ) : trackArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trackArt}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-8 opacity-25"
            style={{ filter: "invert(1) grayscale(1)" }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-7xl opacity-20">
            {countryFlag(c.country) ?? "🏁"}
          </span>
        )}

        {/* cinematic grade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40" />

        {item.on_current_calendar ? (
          <span className="absolute right-3 top-3 rounded-full bg-f1-red/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur">
            2026
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-silver drop-shadow">
            {[c.location, c.country].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 font-display text-lg font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {countryFlag(c.country)} {c.name}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
            <div className="flex gap-4">
              <Metric label="Length" value={c.length_km ? `${c.length_km}km` : "—"} />
              <Metric label="Corners" value={c.corners ?? "—"} />
              <Metric label="GPs" value={item.races_held} />
            </div>
            {item.last_winner ? (
              <p className="max-w-[45%] truncate text-right text-[11px] text-silver">
                <span className="text-muted">Last win</span>
                <br />
                <span className="font-semibold text-foreground">{item.last_winner}</span>
              </p>
            ) : (
              <p className="text-[11px] italic text-muted">New for 2026</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}
