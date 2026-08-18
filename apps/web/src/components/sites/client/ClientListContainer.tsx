"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getClientList } from "@/lib/sites/clients-api";
import { ClientListView } from "./ClientListView";
import type { ClmClient } from "@/types/sites/client";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; clients: ClmClient[] }
  | { kind: "error"; message: string };

/**
 * Owns the GET /clients request client-side (architecture: Supabase session
 * -> apiFetch -> Authorization: Bearer <JWT> -> backend). This has to be a
 * Client Component, not the page itself: apiFetch only has a browser
 * session to read when it runs in the browser (see
 * src/lib/api-client.ts#getAuthHeader) — a Server Component request has no
 * session and would always 401, independent of whether the user is
 * actually signed in.
 */
export function ClientListContainer() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const { clients } = await getClientList();
      setState({ kind: "success", clients });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // No valid session on the backend's side (missing/expired/invalid
        // token) — same destination RequireAuth sends an unauthenticated
        // visitor to. Stay in "loading" rather than flashing an error panel
        // the user would never get to act on before navigating away.
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view clients. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading the client list. Try again, and contact support if the problem continues.",
      });
    }
  }, [router]);

  useEffect(() => {
    // Deferred rather than called inline: `load` sets state synchronously
    // before its first `await`, and calling it directly in an effect body
    // trips the cascading-render lint rule (same pattern as
    // AuthProvider.tsx's initial-session check).
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load clients</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <ClientListView clients={state.clients} />;
}
