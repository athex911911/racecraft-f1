"use client";

import { motion } from "framer-motion";
import { Check, LogOut, Pencil, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import type { FavoriteKind } from "@/types/f1";

const KIND_PATH: Record<FavoriteKind, string> = {
  driver: "/drivers",
  constructor: "/constructors",
  circuit: "/circuits",
};
const KIND_LABEL: Record<FavoriteKind, string> = {
  driver: "Drivers",
  constructor: "Teams",
  circuit: "Circuits",
};
const KINDS: FavoriteKind[] = ["driver", "constructor", "circuit"];

function prettyRef(ref: string): string {
  return ref.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfilePage() {
  const { user, loading, logout, updateProfile, toggleFavorite } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const initials = useMemo(() => {
    const src = user?.display_name || user?.username || "";
    return src.slice(0, 2).toUpperCase();
  }, [user]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  useEffect(() => setName(user?.display_name ?? ""), [user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== user.display_name) {
      await updateProfile({ display_name: trimmed });
      toast("Profile updated");
    }
    setEditing(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      {/* identity card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-5 rounded-card rounded-tr-none border border-white/8 bg-carbon-700 p-6"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-f1-red font-display text-2xl font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={80}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="w-full max-w-xs rounded-lg border border-white/10 bg-carbon-800 px-3 py-1.5 text-lg text-foreground outline-none focus:border-f1-red/50"
              />
              <button onClick={saveName} className="rounded-md p-1.5 text-success hover:bg-white/5" aria-label="Save">
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md p-1.5 text-muted hover:bg-white/5"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold uppercase italic tracking-wide">
                {user.display_name || user.username}
              </h1>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md p-1.5 text-muted transition hover:bg-white/5 hover:text-white"
                aria-label="Edit display name"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="mt-0.5 text-sm text-muted">
            @{user.username} · {user.email}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Member since{" "}
            {new Date(user.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="inline-flex items-center gap-2 rounded-lg rounded-tr-none border border-white/10 px-3.5 py-2 text-sm font-semibold text-silver transition hover:border-f1-red/50 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </motion.div>

      {/* favorites */}
      <div className="rounded-card rounded-tr-none border border-white/8 bg-carbon-700 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-f1-red" />
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-silver">
            Favorites
          </h2>
        </div>

        {user.favorites.length === 0 ? (
          <p className="text-sm text-muted">
            No favorites yet. Tap the ☆ on any driver, team or circuit to pin it here.
          </p>
        ) : (
          <div className="space-y-5">
            {KINDS.map((kind) => {
              const items = user.favorites.filter((f) => f.entity_type === kind);
              if (!items.length) return null;
              return (
                <div key={kind}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    {KIND_LABEL[kind]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((f) => (
                      <div
                        key={f.entity_ref}
                        className="group flex items-center gap-2 rounded-lg rounded-tr-none border border-white/10 bg-carbon-800 py-1.5 pl-3 pr-1.5 text-sm"
                      >
                        <Link
                          href={`${KIND_PATH[kind]}/${f.entity_ref}`}
                          className="font-semibold text-silver transition hover:text-white"
                        >
                          {prettyRef(f.entity_ref)}
                        </Link>
                        <button
                          onClick={() => {
                            toggleFavorite(kind, f.entity_ref);
                            toast("Removed from favorites", "info");
                          }}
                          className="rounded p-1 text-muted transition hover:bg-white/5 hover:text-f1-red"
                          aria-label={`Remove ${f.entity_ref}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
