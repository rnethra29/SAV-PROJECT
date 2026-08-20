"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorRating, getVendorPerformance, getVendorRatings } from "@/lib/sites/vendor-performance-api";
import { getProcurementOrderList } from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorRating, devGetVendorPerformance, devGetVendorRatings } from "@/lib/dev-preview/vendor-performance-fixtures";
import { devGetProcurementOrderList } from "@/lib/dev-preview/procurement-fixtures";
import { VendorPerformanceStatsView } from "./VendorPerformanceStatsView";
import { VendorRatingsListView } from "./VendorRatingsListView";
import { VendorRatingCreateForm } from "./VendorRatingCreateForm";
import type { VndVendorPerformance, VndVendorRating, VndVendorRatingCreateInput } from "@/types/sites/vendor-performance";
import type { VndPurchaseOrder } from "@/types/sites/procurement-order";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; performance: VndVendorPerformance | null; ratings: VndVendorRating[]; purchaseOrders: VndPurchaseOrder[] }
  | { kind: "error"; message: string };

type VendorPerformanceContainerProps = {
  vendorId: string;
};

/**
 * Vendor 360 Performance/Ratings section — v_vendor_performance +
 * vnd_vendor_rating (doc §6.10/§6.17). Real GET /vendors/:vendorId/performance
 * and GET/POST /vendors/:vendorId/ratings, same list-panel-with-inline-
 * create-form shape as VendorContactsContainer/VendorMaterialsContainer.
 * The vendor's own POs are fetched too, for the rating form's optional
 * "which PO/delivery was this about" link.
 */
export function VendorPerformanceContainer({ vendorId }: VendorPerformanceContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [performance, ratings, { orders }] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorPerformance(vendorId), devGetVendorRatings(vendorId), devGetProcurementOrderList()])
        : await Promise.all([getVendorPerformance(vendorId), getVendorRatings(vendorId), getProcurementOrderList()]);
      setState({ kind: "success", performance, ratings, purchaseOrders: orders.filter((po) => po.vendor_id === vendorId) });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this vendor's performance. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading performance data. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, vendorId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: VndVendorRatingCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateVendorRating(vendorId, input);
    } else {
      await createVendorRating(vendorId, input);
    }
    setIsFormOpen(false);
    await load();
  }

  if (state.kind === "loading") {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load performance data</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { performance, ratings, purchaseOrders } = state;

  return (
    <div className="space-y-2">
      <Panel className="space-y-4 bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">Performance</h3>
        {performance ? (
          <VendorPerformanceStatsView performance={performance} />
        ) : (
          <p className="text-sm text-text-secondary">No purchase orders or ratings recorded for this vendor yet.</p>
        )}
      </Panel>

      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Ratings</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Rating"}
          </Button>
        </div>

        <VendorRatingsListView ratings={ratings} purchaseOrders={purchaseOrders} />
      </Panel>

      {isFormOpen && (
        <VendorRatingCreateForm purchaseOrders={purchaseOrders} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
