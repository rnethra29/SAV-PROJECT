"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getClientBillingOverview } from "@/lib/sites/client-billing-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetClientBillingOverview } from "@/lib/dev-preview/client-fixtures";
import { ClientBillingOverviewView } from "./ClientBillingOverviewView";
import type { ClmClientBillingOverview } from "@/types/sites/billing";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; overview: ClmClientBillingOverview }
  | { kind: "error"; message: string };

type ClientBillingContainerProps = {
  clientId: string;
};

/**
 * Client 360 Billing section. Same list-panel shape as
 * ClientRequirementsContainer/ClientContactsContainer, but read-only —
 * invoice/payment creation are Finance/Accounts-owned financial workflows
 * (src/validators/clmClientInvoice.validator.js, clmPayment.validator.js,
 * both gated to ROLES.FINANCE_ACCOUNTS_TEAM) out of scope for this Client
 * 360 phase. Backed by the real GET /clients/:clientId/360 overview
 * (src/routes/clmClient.routes.js:42) — every figure (paid/balance per
 * invoice, allocated/unallocated per payment, total outstanding) is
 * pre-computed by the backend's own views
 * (src/database/migrations/019_clm_views.sql), never recalculated here.
 * Client Component because apiFetch's Bearer token only exists in a
 * browser session.
 */
export function ClientBillingContainer({ clientId }: ClientBillingContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const overview = DEV_FIXTURE_MODE
        ? await devGetClientBillingOverview(clientId)
        : await getClientBillingOverview(clientId);
      setState({ kind: "success", overview });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this client's billing information. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading billing information. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, clientId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  if (state.kind === "loading") {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load billing information</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <ClientBillingOverviewView overview={state.overview} />;
}
