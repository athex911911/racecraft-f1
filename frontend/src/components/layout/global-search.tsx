"use client";

import { Flag, Globe2, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DriverAvatar } from "@/components/f1/driver-avatar";
import { useSearch } from "@/lib/api/hooks";
import { cn, countryFlag, nationalityFlag } from "@/lib/utils";

type Row = { key: string; href: string; render: React.ReactNode };

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // debounce the query the API sees
  useEffect(() => {
    const id = setTimeout(() => setQuery(raw), 180);
    return () => clearTimeout(id);
  }, [raw]);

  const { data, isFetching } = useSearch(query);

  // Cmd/Ctrl+K to focus, Escape to dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // click-away
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const r: Row[] = [];
    for (const d of data.drivers) {
      r.push({
        key: `d-${d.ref}`,
        href: `/drivers/${d.ref}`,
        render: (
          <>
            <DriverAvatar
              driver={{
                id: 0,
                driver_ref: d.ref,
                code: d.code,
                number: null,
                full_name: d.name,
                nationality: d.nationality,
                headshot_url: d.headshot_url,
              }}
              size="sm"
            />
            <span className="flex-1 truncate">
              {nationalityFlag(d.nationality)} {d.name}
            </span>
            <Kind icon={<User className="h-3 w-3" />} label="Driver" />
          </>
        ),
      });
    }
    for (const c of data.constructors) {
      r.push({
        key: `c-${c.ref}`,
        href: `/constructors/${c.ref}`,
        render: (
          <>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ background: `${c.color ?? "#3d3d3d"}22`, boxShadow: `inset 0 0 0 1.5px ${c.color ?? "#3d3d3d"}` }}
            >
              <Flag className="h-3.5 w-3.5" style={{ color: c.color ?? "#bfbfbf" }} />
            </span>
            <span className="flex-1 truncate">{c.name}</span>
            <Kind icon={<Flag className="h-3 w-3" />} label="Team" />
          </>
        ),
      });
    }
    for (const c of data.circuits) {
      r.push({
        key: `t-${c.ref}`,
        href: `/circuits/${c.ref}`,
        render: (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-base">
              {countryFlag(c.country) ?? <Globe2 className="h-3.5 w-3.5 text-muted" />}
            </span>
            <span className="flex-1 truncate">{c.name}</span>
            <Kind icon={<Globe2 className="h-3 w-3" />} label="Circuit" />
          </>
        ),
      });
    }
    return r;
  }, [data]);

  useEffect(() => setActive(0), [rows.length]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
    setRaw("");
    setQuery("");
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && rows[active]) {
      go(rows[active].href);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showPanel = open && query.length >= 2;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search drivers, teams, circuits…"
          className="w-full rounded-lg border border-white/10 bg-carbon-800/70 py-2 pl-9 pr-14 text-sm text-foreground placeholder:text-muted focus:border-f1-red/50 focus:outline-none focus:ring-1 focus:ring-f1-red/25"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted sm:block">
          ⌘K
        </kbd>
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-carbon-900/98 p-1.5 shadow-2xl backdrop-blur-xl">
          {rows.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              {isFetching ? "Searching…" : `No results for “${query}”. Try “Verstappen” or “Monza”.`}
            </p>
          ) : (
            rows.map((row, i) => (
              <button
                key={row.key}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(row.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-white/8 text-white" : "text-silver hover:bg-white/5",
                )}
              >
                {row.render}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Kind({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/8 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted">
      {icon}
      {label}
    </span>
  );
}
