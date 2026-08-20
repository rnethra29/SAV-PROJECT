"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getProcurementOrderById } from "@/lib/sites/procurement-orders-api";
import { getVendorList } from "@/lib/sites/vendors-api";
import { getProjectOptions } from "@/lib/sites/projects-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetProcurementOrderById, devGetProjectOptions } from "@/lib/dev-preview/procurement-fixtures";
import { devGetVendorList } from "@/lib/dev-preview/vendor-fixtures";
import { ProcurementOrderDetailView } from "./ProcurementOrderDetailView";
import type { VndPurchaseOrderDetail } from "@/types/sites/procurement-order";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; order: VndPurchaseOrderDetail; vendors: VndVendor[]; projects: ClmProjectLookup[] }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

type ProcurementOrderDetailContainerProps = {
  poId: string;
};

/**
 * Owns the GET /procurement-orders/:id request client-side, same reasoning
 * as VendorDetailContainer. Vendor/Project lookups are fetched alongside so
 * the header can show resolved names instead of raw ids.
 */
export function ProcurementOrderDetailContainer({ poId }: ProcurementOrderDetailContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [order, { vendors }, projects] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetProcurementOrderById(poId), devGetVendorList(), devGetProjectOptions()])
        : await Promise.all([getProcurementOrderById(poId), getVendorList(), getProjectOptions()]);
      setState({ kind: "success", order, vendors, projects });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this purchase order. Contact an administrator.",
        });
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setState({ kind: "not-found" });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading this purchase order. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, poId]);

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
          <p className="text-sm font-medium text-text-primary">Purchase order not found</p>
          <p className="text-sm text-text-secondary">This purchase order may have been deleted, or the link is incorrect.</p>
        </div>
        <Button onClick={() => router.push("/sites/procurement")}>Back to Purchase Orders</Button>
      </Panel>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load this purchase order</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <ProcurementOrderDetailView order={state.order} vendors={state.vendors} projects={state.projects} />;
}
