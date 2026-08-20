"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Local-development-only escape hatch so frontend work isn't blocked while
 * Supabase/Auth is configured separately. Double-gated on purpose: Next.js
 * hard-sets NODE_ENV to "production" for `next build`/`next start`
 * regardless of env vars, so this can never be true in a real build; the
 * NEXT_PUBLIC_DEV_BYPASS_AUTH flag is a second, explicit opt-in so running
 * `next dev` alone doesn't silently skip the gate for everyone. Set via
 * apps/web/.env.local (gitignored, never committed) — not read anywhere
 * else, and does not touch Supabase config, JWT validation, or the backend.
 */
const DEV_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

/**
 * Route guard for every route under app/(app) (architecture: User ->
 * Supabase Auth -> session -> JWT -> apiFetch -> backend). "unconfigured"
 * (Supabase env vars missing) is redirected the same as "unauthenticated" —
 * there is no session to grant access with either way.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (DEV_AUTH_BYPASS) return;
    if (status === "unauthenticated" || status === "unconfigured") {
      router.replace("/login");
    }
  }, [status, router]);

  if (!DEV_AUTH_BYPASS && status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
