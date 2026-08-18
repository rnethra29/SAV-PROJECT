"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";

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
    if (status === "unauthenticated" || status === "unconfigured") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
