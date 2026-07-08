"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";

export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (loading) return <div className="h-9 w-9 shrink-0 rounded-full bg-white/5" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="shrink-0 rounded-md rounded-tr-none border border-white/12 px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-wide text-silver transition hover:border-f1-red/50 hover:text-white"
      >
        Sign in
      </Link>
    );
  }

  const initials = (user.display_name || user.username).slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-f1-red font-display text-xs font-bold text-white ring-2 ring-transparent transition hover:ring-white/20"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-lg rounded-tr-none border border-white/10 bg-carbon-850 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
          <div className="border-b border-white/8 px-4 py-3">
            <p className="truncate font-semibold text-foreground">
              {user.display_name || user.username}
            </p>
            <p className="truncate text-xs text-muted">@{user.username}</p>
          </div>
          <nav className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-silver transition hover:bg-white/5 hover:text-white"
            >
              <UserIcon className="h-4 w-4" /> Profile &amp; favorites
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                logout();
                router.push("/");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-silver transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
