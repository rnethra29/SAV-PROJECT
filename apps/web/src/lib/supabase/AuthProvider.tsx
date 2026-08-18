"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";

// "unconfigured" is distinct from "unauthenticated": the former means
// Supabase itself can't be reached (missing NEXT_PUBLIC_SUPABASE_URL/
// NEXT_PUBLIC_SUPABASE_ANON_KEY), the latter means Supabase is reachable but
// there's no session. RequireAuth treats both as "send to /login", but
// LoginForm reports them with different, honest messages.
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unconfigured";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Single source of truth for the Supabase Auth session, mounted once at the
 * root layout (architecture: User -> Supabase Auth -> session -> JWT ->
 * apiFetch -> backend). Reads the initial session once, then subscribes via
 * onAuthStateChange for every subsequent change (login, logout, token
 * refresh, expiry) — Supabase's documented pattern — rather than re-deriving
 * it per page or polling.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      // Deferred rather than called inline: setState directly in an effect
      // body triggers a cascading-render lint error (same pattern as
      // Header.tsx's clock tick). Routing it through a resolved-promise
      // callback keeps one code path with the getSession().then() below and
      // satisfies the rule.
      Promise.resolve().then(() => {
        if (!cancelled) setStatus("unconfigured");
      });
      return () => {
        cancelled = true;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      // Not configured — there was never a real session to clear.
    }
  }

  return (
    <AuthContext.Provider value={{ status, session, user: session?.user ?? null, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
