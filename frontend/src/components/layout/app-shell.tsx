"use client";

import {
  BarChart3,
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
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { HealthDot } from "@/components/layout/health-dot";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/constructors", label: "Constructors", icon: Flag },
  { href: "/circuits", label: "Circuits", icon: Globe2 },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/predictor", label: "Race Predictor", icon: Sparkles },
  { href: "/strategy", label: "Strategy", icon: Gauge },
  { href: "/history", label: "History", icon: History },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/hall-of-fame", label: "Hall of Fame", icon: Trophy },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-f1-red font-display text-sm font-bold text-white shadow-[0_0_18px_rgba(225,6,0,0.5)]">
          F1
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-wide">
              F1 INSIGHT <span className="text-f1-red">AI</span>
            </p>
            <p className="truncate text-[10px] uppercase tracking-widest text-muted">
              Analytics Platform
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-f1-red/15 font-semibold text-white"
                  : "text-silver hover:bg-white/5 hover:text-white",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={cn("h-4.5 w-4.5 shrink-0", active ? "text-f1-red" : "text-muted group-hover:text-silver")}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-f1-red" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-4 py-3">
        <HealthDot collapsed={collapsed} />
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
          <BarChart3 className="hidden h-4 w-4 text-f1-red sm:block" />
          <p className="hidden text-xs uppercase tracking-[0.2em] text-muted sm:block">
            Intelligent Formula One Analytics
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-silver">
              Beta
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
