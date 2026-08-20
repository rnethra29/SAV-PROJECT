"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createProcurementOrderItem, getProcurementOrderItems } from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateProcurementOrderItem, devGetProcurementOrderItems } from "@/lib/dev-preview/procurement-fixtures";
import { ProcurementOrderItemCreateForm } from "./ProcurementOrderItemCreateForm";
import { ProcurementOrderItemsListView } from "./ProcurementOrderItemsListView";
import type { VndPurchaseOrderItem, VndPurchaseOrderItemCreateInput } from "@/types/sites/procurement-order";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; items: VndPurchaseOrderItem[] }
  | { kind: "error"; message: string };

type ProcurementOrderItemsContainerProps = {
  poId: string;
  onItemsChanged?: () => void;
  // Bumped by the parent whenever something OTHER than this container
  // changes the item rows out from under it — specifically
  // ProcurementOrderStatusActions' Receive Goods action, which writes
  // received_quantity directly via the fixture/API and has no other way to
  // tell this container's own independent `load()` to re-run. onItemsChanged
  // only covers changes *this* container initiates (adding an item).
  refreshSignal?: number;
};

/**
 * PO workspace Items section — vnd_purchase_order_item (doc §6.12). Same
 * list-panel-with-inline-create-form shape as VendorMaterialsContainer,
 * backed by the real nested GET/POST /procurement-orders/:poId/items
 * endpoints. onItemsChanged lets the parent (ProcurementOrderDetailView)
 * re-fetch the PO header after an item add, since the real backend's
 * trigger recalculates subtotal/tax/total on every item write.
 */
export function ProcurementOrderItemsContainer({ poId, onItemsChanged, refreshSignal }: ProcurementOrderItemsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const items = DEV_FIXTURE_MODE ? await devGetProcurementOrderItems(poId) : await getProcurementOrderItems(poId);
      setState({ kind: "success", items });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this purchase order's items. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading line items. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, poId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load, refreshSignal]);

  async function handleCreate(input: VndPurchaseOrderItemCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateProcurementOrderItem(poId, input);
    } else {
      await createProcurementOrderItem(poId, input);
    }
    setIsFormOpen(false);
    await load();
    onItemsChanged?.();
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

  const { items } = state;
  const nextSequenceNo = items.reduce((max, item) => Math.max(max, item.sequence_no), 0) + 1;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Items</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Item"}
          </Button>
        </div>

        <ProcurementOrderItemsListView items={items} />
      </Panel>

      {isFormOpen && (
        <ProcurementOrderItemCreateForm
          nextSequenceNo={nextSequenceNo}
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
