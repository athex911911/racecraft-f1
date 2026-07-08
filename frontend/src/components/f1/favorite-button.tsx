"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import type { FavoriteKind } from "@/types/f1";

/** Star toggle that pins a driver / team / circuit to the signed-in user's favorites. */
export function FavoriteButton({
  kind,
  entityRef,
  className,
}: {
  kind: FavoriteKind;
  entityRef: string;
  className?: string;
}) {
  const { user, isFavorite, toggleFavorite } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const active = isFavorite(kind, entityRef);

  const onClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await toggleFavorite(kind, entityRef);
      toast(active ? "Removed from favorites" : "Added to favorites", active ? "info" : "success");
    } catch {
      toast("Couldn't update favorites", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={user ? (active ? "Remove from favorites" : "Add to favorites") : "Sign in to save"}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg rounded-tr-none border px-3 py-2 text-sm font-semibold transition disabled:opacity-60",
        active
          ? "border-f1-red/50 bg-f1-red/10 text-white"
          : "border-white/12 text-silver hover:border-white/25 hover:text-white",
        className,
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-f1-red text-f1-red")} />
      {active ? "Saved" : "Save"}
    </button>
  );
}
