"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiGet, apiSend, clearToken, getToken, setToken } from "@/lib/api/client";
import type { AuthToken, AuthUser, Favorite, FavoriteKind } from "@/types/f1";

interface RegisterInput {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { display_name?: string; theme?: string }) => Promise<void>;
  isFavorite: (kind: FavoriteKind, ref: string) => boolean;
  toggleFavorite: (kind: FavoriteKind, ref: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate the session from a stored token on first load.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    apiGet<AuthUser>("/api/v1/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await apiSend<AuthToken>("POST", "/api/v1/auth/login", { identifier, password });
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const res = await apiSend<AuthToken>("POST", "/api/v1/auth/register", data);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: { display_name?: string; theme?: string }) => {
    const updated = await apiSend<AuthUser>("PATCH", "/api/v1/auth/me", data);
    setUser(updated);
  }, []);

  const isFavorite = useCallback(
    (kind: FavoriteKind, ref: string) =>
      !!user?.favorites.some((f) => f.entity_type === kind && f.entity_ref === ref),
    [user],
  );

  const toggleFavorite = useCallback(
    async (kind: FavoriteKind, ref: string) => {
      if (!user) return;
      const has = user.favorites.some((f) => f.entity_type === kind && f.entity_ref === ref);
      const favorites = has
        ? await apiSend<Favorite[]>("DELETE", "/api/v1/auth/favorites", undefined, {
            entity_type: kind,
            entity_ref: ref,
          })
        : await apiSend<Favorite[]>("POST", "/api/v1/auth/favorites", {
            entity_type: kind,
            entity_ref: ref,
          });
      setUser({ ...user, favorites });
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, isFavorite, toggleFavorite }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
