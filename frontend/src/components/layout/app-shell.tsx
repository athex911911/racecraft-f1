"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { GlobalSearch } from "@/components/layout/global-search";
import { HealthDot } from "@/components/layout/health-dot";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

// Flat top navigation, like the official F1 site ("Teams", not "Constructors").
// The nav lives in its own full-width menu bar under the brand row, so every
// section stays visible on the header instead of hiding behind a menu button.
type NavItem = { href: string; label: string };
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/drivers", label: "Drivers" },
  { href: "/constructors", label: "Teams" },
  { href: "/circuits", label: "Circuits" },
  { href: "/compare", label: "Compare" },
  { href: "/predictor", label: "Predictor" },
  { href: "/strategy", label: "Strategy" },
  { href: "/league", label: "League" },
  { href: "/assistant", label: "Assistant" },
  { href: "/history", label: "History" },
  { href: "/calendar", label: "Calendar" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 0.7, 0.2, 1] }}
        className="sticky top-0 z-40 border-b border-white/10 bg-carbon-850/85 backdrop-blur-xl"
      >
        {/* row 1 — brand · search · account */}
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md rounded-tr-none bg-black ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/racecraft-mark.png"
                alt="Racecraft"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block font-display text-lg font-bold uppercase italic leading-none tracking-wide">
                Racecraft
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.28em] text-muted">
                Formula One Analytics
              </span>
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">
            <GlobalSearch />
            <span className="hidden shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-silver min-[1360px]:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-f1-red" />
              2026 Season
            </span>
          </div>
        </div>

        {/* row 2 — the menu bar: every section plus the account control, on the header */}
        <div className="border-t border-white/5">
          <div className="mx-auto flex h-11 max-w-[1440px] items-stretch gap-2 px-2 sm:px-4">
            <nav className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group relative flex shrink-0 items-center whitespace-nowrap px-3 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors",
                      active ? "text-white" : "text-silver hover:text-white",
                    )}
                  >
                    {label}
                    {!active && (
                      <span className="pointer-events-none absolute inset-x-3 bottom-0 h-[3px] origin-center scale-x-0 bg-f1-red transition-transform duration-300 ease-[cubic-bezier(0.22,0.7,0.2,1)] group-hover:scale-x-100" />
                    )}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3 bottom-0 h-[3px] bg-f1-red"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="flex shrink-0 items-center pl-1">
              <UserMenu />
            </div>
          </div>
        </div>
      </motion.header>

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
            Racecraft · Formula One Analytics
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
