"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  Flag,
  Gauge,
  GitCompareArrows,
  Globe2,
  History,
  LayoutDashboard,
  Menu,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GlobalSearch } from "@/components/layout/global-search";
import { HealthDot } from "@/components/layout/health-dot";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Users };

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Explore",
    items: [
      { href: "/drivers", label: "Drivers", icon: Users },
      { href: "/constructors", label: "Constructors", icon: Flag },
      { href: "/circuits", label: "Circuits", icon: Globe2 },
      { href: "/compare", label: "Compare", icon: GitCompareArrows },
    ],
  },
  {
    label: "Predict",
    items: [
      { href: "/predictor", label: "Race Predictor", icon: Sparkles },
      { href: "/strategy", label: "Strategy", icon: Gauge },
    ],
  },
  {
    label: "The Archive",
    items: [
      { href: "/history", label: "History", icon: History },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-3 px-4 py-5" onClick={() => setMobileOpen(false)}>
        <motion.div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-f1-red font-display text-sm font-bold text-white"
          animate={{ boxShadow: ["0 0 14px rgba(225,6,0,0.35)", "0 0 22px rgba(225,6,0,0.6)", "0 0 14px rgba(225,6,0,0.35)"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          F1
        </motion.div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-wide">
              F1 INSIGHT <span className="text-f1-red">AI</span>
            </p>
            <p className="truncate text-[10px] uppercase tracking-widest text-muted">
              The Paddock, Decoded
            </p>
          </div>
        )}
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? `g-${gi}`} className="space-y-1">
            {group.label && !collapsed && (
              <p className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted/70">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active ? "font-semibold text-white" : "text-silver hover:bg-white/5 hover:text-white",
                  )}
                  title={collapsed ? label : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-f1-red/15 ring-1 ring-inset ring-f1-red/25"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-rail"
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-f1-red"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-4.5 w-4.5 shrink-0 transition-colors",
                      active ? "text-f1-red" : "text-muted group-hover:text-silver",
                    )}
                  />
                  {!collapsed && <span className="relative z-10 truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/5 px-4 py-3">
        <HealthDot collapsed={collapsed} />
        {!collapsed && (
          <p className="text-[10px] text-muted/70">
            Crafted by <span className="font-semibold text-silver">athex</span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-white/5 bg-carbon-950/80 backdrop-blur-xl transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {sidebar}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-carbon-700 text-silver transition hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-white/10 bg-carbon-950">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/5 bg-carbon-900/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg p-2 text-silver hover:bg-white/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-silver md:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-f1-red opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-f1-red" />
              </span>
              2026 Season
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-silver">
              Beta
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
