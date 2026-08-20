"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorInvoiceItem, getVendorInvoiceItems } from "@/lib/sites/vendor-invoices-api";
import { getProcurementOrderItems } from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorInvoiceItem, devGetVendorInvoiceItems } from "@/lib/dev-preview/vendor-invoice-fixtures";
import { devGetProcurementOrderItems } from "@/lib/dev-preview/procurement-fixtures";
import { VendorInvoiceItemCreateForm } from "./VendorInvoiceItemCreateForm";
import { VendorInvoiceItemsListView } from "./VendorInvoiceItemsListView";
import type { VndVendorInvoiceItem, VndVendorInvoiceItemCreateInput } from "@/types/sites/vendor-invoice";
import type { VndPurchaseOrderItem } from "@/types/sites/procurement-order";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; items: VndVendorInvoiceItem[]; poItems: VndPurchaseOrderItem[] }
  | { kind: "error"; message: string };

type VendorInvoiceItemsContainerProps = {
  invoiceId: string;
  purchaseOrderId: string | null;
};

/**
 * Invoice workspace reconciliation-items section — vnd_vendor_invoice_item
 * (doc §6.14). Also loads the linked PO's own items (if any) so the create
 * form can offer "reconcile against this PO item" as a dropdown, matching
 * the nullable po_item_id link the schema defines.
 */
export function VendorInvoiceItemsContainer({ invoiceId, purchaseOrderId }: VendorInvoiceItemsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [items, poItems] = DEV_FIXTURE_MODE
        ? await Promise.all([
            devGetVendorInvoiceItems(invoiceId),
            purchaseOrderId ? devGetProcurementOrderItems(purchaseOrderId) : Promise.resolve([]),
          ])
        : await Promise.all([
            getVendorInvoiceItems(invoiceId),
            purchaseOrderId ? getProcurementOrderItems(purchaseOrderId) : Promise.resolve([]),
          ]);
      setState({ kind: "success", items, poItems });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this invoice's line items. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading line items. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, invoiceId, purchaseOrderId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: VndVendorInvoiceItemCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateVendorInvoiceItem(invoiceId, input);
    } else {
      await createVendorInvoiceItem(invoiceId, input);
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load line items</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { items, poItems } = state;
  const nextSequenceNo = items.reduce((max, item) => Math.max(max, item.sequence_no), 0) + 1;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Reconciliation Lines</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Line"}
          </Button>
        </div>

        <VendorInvoiceItemsListView items={items} />
      </Panel>

      {isFormOpen && (
        <VendorInvoiceItemCreateForm
          poItems={poItems}
          nextSequenceNo={nextSequenceNo}
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
