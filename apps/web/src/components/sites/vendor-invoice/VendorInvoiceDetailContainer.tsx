"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getVendorInvoiceById } from "@/lib/sites/vendor-invoices-api";
import { getVendorList } from "@/lib/sites/vendors-api";
import { getProjectOptions } from "@/lib/sites/projects-api";
import { getProcurementOrderList } from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorInvoiceById } from "@/lib/dev-preview/vendor-invoice-fixtures";
import { devGetVendorList } from "@/lib/dev-preview/vendor-fixtures";
import { devGetProcurementOrderList, devGetProjectOptions } from "@/lib/dev-preview/procurement-fixtures";
import { VendorInvoiceDetailView } from "./VendorInvoiceDetailView";
import type { VndVendorInvoiceDetail } from "@/types/sites/vendor-invoice";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";
import type { VndPurchaseOrder } from "@/types/sites/procurement-order";

type LoadState =
  | {
      kind: "success";
      invoice: VndVendorInvoiceDetail;
      vendors: VndVendor[];
      projects: ClmProjectLookup[];
      purchaseOrders: VndPurchaseOrder[];
    }
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

type VendorInvoiceDetailContainerProps = {
  invoiceId: string;
};

/**
 * Owns the GET /vendor-invoices/:id request client-side, same reasoning as
 * ProcurementOrderDetailContainer. Vendor/Project/PO lookups fetched
 * alongside so the header can show resolved names/numbers.
 */
export function VendorInvoiceDetailContainer({ invoiceId }: VendorInvoiceDetailContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [invoice, { vendors }, projects, { orders }] = DEV_FIXTURE_MODE
        ? await Promise.all([
            devGetVendorInvoiceById(invoiceId),
            devGetVendorList(),
            devGetProjectOptions(),
            devGetProcurementOrderList(),
          ])
        : await Promise.all([
            getVendorInvoiceById(invoiceId),
            getVendorList(),
            getProjectOptions(),
            getProcurementOrderList(),
          ]);
      setState({ kind: "success", invoice, vendors, projects, purchaseOrders: orders });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this vendor invoice. Contact an administrator.",
        });
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setState({ kind: "not-found" });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading this invoice. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, invoiceId]);

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
          <p className="text-sm font-medium text-text-primary">Vendor invoice not found</p>
          <p className="text-sm text-text-secondary">This invoice may have been deleted, or the link is incorrect.</p>
        </div>
        <Button onClick={() => router.push("/sites/vendor-invoices")}>Back to Vendor Invoices</Button>
      </Panel>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load this vendor invoice</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return (
    <VendorInvoiceDetailView
      invoice={state.invoice}
      vendors={state.vendors}
      projects={state.projects}
      purchaseOrders={state.purchaseOrders}
    />
  );
}
