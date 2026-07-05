"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GlobalSearch } from "@/components/layout/global-search";
import { HealthDot } from "@/components/layout/health-dot";
import { cn } from "@/lib/utils";

// Flat top navigation, like the official F1 site ("Teams", not "Constructors").
const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/drivers", label: "Drivers" },
  { href: "/constructors", label: "Teams" },
  { href: "/circuits", label: "Circuits" },
  { href: "/compare", label: "Compare" },
  { href: "/predictor", label: "Predictor" },
  { href: "/strategy", label: "Strategy" },
  { href: "/history", label: "History" },
  { href: "/calendar", label: "Calendar" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-carbon-900">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          {/* brand */}
          <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="flex h-9 w-10 items-center justify-center rounded-md rounded-tr-none bg-f1-red font-display text-sm font-black italic text-white">
              F1
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block font-display text-sm font-black uppercase italic leading-tight tracking-wide">
                F1 Insight <span className="text-f1-red">AI</span>
              </span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-muted">
                The Paddock, Decoded
              </span>
            </span>
          </Link>

          {/* header hatching, as on formula1.com */}
          <div className="f1-hatch hidden h-16 w-10 shrink-0 xl:block" aria-hidden />

          {/* primary nav */}
          <nav className="hidden h-16 items-stretch lg:flex">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center px-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors xl:px-3.5",
                    active ? "text-white" : "text-silver hover:text-white",
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-1 bottom-0 h-[3px] bg-f1-red"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">
            <GlobalSearch />
            <span className="hidden shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-silver min-[1360px]:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-f1-red" />
              2026 Season
            </span>
            <button
              className="rounded-md p-2 text-silver hover:bg-white/5 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* mobile nav panel */}
        {mobileOpen && (
          <nav className="border-t border-white/10 bg-carbon-900 lg:hidden">
            <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-1 px-4 py-3 sm:px-6">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-bold uppercase tracking-wide",
                      active
                        ? "border-l-[3px] border-f1-red bg-white/5 text-white"
                        : "text-silver hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            F1 Insight AI · The Paddock, Decoded
          </p>
          <div className="flex items-center gap-4">
            <HealthDot />
            <p className="text-[11px] text-muted">
              Crafted by <span className="font-semibold text-silver">athex</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
