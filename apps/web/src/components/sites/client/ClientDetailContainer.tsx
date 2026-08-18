"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getClientById, getClientTypeOptions, getIndustryOptions } from "@/lib/sites/clients-api";
import { ClientDetailView } from "./ClientDetailView";
import type { ClmClientDetail, ClmClientType, ClmIndustry } from "@/types/sites/client";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; client: ClmClientDetail; clientTypes: ClmClientType[]; industries: ClmIndustry[] }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

type ClientDetailContainerProps = {
  clientId: string;
};

/**
 * Owns the GET /clients/:id request client-side, same reasoning as
 * ClientListContainer — this has to be a Client Component so apiFetch has a
 * browser Supabase session to attach as a Bearer token.
 */
export function ClientDetailContainer({ clientId }: ClientDetailContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      // Lookups fetched alongside the client so the shell can show
      // "Client Type: Contractor" instead of a raw client_type_id — the
      // detail response is a plain `SELECT * FROM clm_client` with no join
      // (src/repositories/clmClient.repository.js), so it has no label to
      // give us on its own.
      const [client, clientTypes, industries] = await Promise.all([
        getClientById(clientId),
        getClientTypeOptions(),
        getIndustryOptions(),
      ]);
      setState({ kind: "success", client, clientTypes, industries });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this client. Contact an administrator.",
        });
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setState({ kind: "not-found" });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading this client. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, clientId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (state.kind === "not-found") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-text-secondary" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Client not found</p>
          <p className="text-sm text-text-secondary">
            This client may have been deleted, or the link is incorrect.
          </p>
        </div>
        <Button onClick={() => router.push("/sites/clients")}>Back to Clients</Button>
      </Panel>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load this client</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <ClientDetailView client={state.client} clientTypes={state.clientTypes} industries={state.industries} />;
}
