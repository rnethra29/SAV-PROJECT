"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorPaymentAllocation, getVendorPaymentAllocations } from "@/lib/sites/vendor-payments-api";
import { getVendorInvoiceList } from "@/lib/sites/vendor-invoices-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorPaymentAllocation, devGetVendorPaymentAllocations } from "@/lib/dev-preview/vendor-payment-fixtures";
import { devGetVendorInvoiceList } from "@/lib/dev-preview/vendor-invoice-fixtures";
import { VendorPaymentAllocationCreateForm } from "./VendorPaymentAllocationCreateForm";
import { VendorPaymentAllocationsListView } from "./VendorPaymentAllocationsListView";
import type { VndVendorPaymentAllocation, VndVendorPaymentAllocationCreateInput } from "@/types/sites/vendor-payment";
import type { VndVendorInvoice } from "@/types/sites/vendor-invoice";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; allocations: VndVendorPaymentAllocation[]; invoices: VndVendorInvoice[] }
  | { kind: "error"; message: string };

type VendorPaymentAllocationsContainerProps = {
  paymentId: string;
  vendorId: string;
};

/**
 * Payment workspace Allocations section — vnd_vendor_payment_allocation
 * (doc §6.16, append-only). Only invoices belonging to the same vendor as
 * this payment are offered, matching the real backend's own vendor-match
 * check (vndVendorPaymentAllocation.service.js#create).
 */
export function VendorPaymentAllocationsContainer({ paymentId, vendorId }: VendorPaymentAllocationsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [allocations, { invoices: allInvoices }] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorPaymentAllocations(paymentId), devGetVendorInvoiceList()])
        : await Promise.all([getVendorPaymentAllocations(paymentId), getVendorInvoiceList()]);
      setState({ kind: "success", allocations, invoices: allInvoices.filter((i) => i.vendor_id === vendorId) });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this payment's allocations. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading allocations. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, paymentId, vendorId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: VndVendorPaymentAllocationCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateVendorPaymentAllocation(paymentId, input);
    } else {
      await createVendorPaymentAllocation(paymentId, input);
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load allocations</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { allocations, invoices } = state;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Allocations</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Allocation"}
          </Button>
        </div>

        <VendorPaymentAllocationsListView allocations={allocations} invoices={invoices} />
      </Panel>

      {isFormOpen && (
        <VendorPaymentAllocationCreateForm invoices={invoices} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
