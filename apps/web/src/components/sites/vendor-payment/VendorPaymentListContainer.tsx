"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getVendorPaymentList } from "@/lib/sites/vendor-payments-api";
import { getVendorList } from "@/lib/sites/vendors-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorPaymentList } from "@/lib/dev-preview/vendor-payment-fixtures";
import { devGetVendorList } from "@/lib/dev-preview/vendor-fixtures";
import { VendorPaymentListView } from "./VendorPaymentListView";
import type { VndVendorPayment } from "@/types/sites/vendor-payment";
import type { VndVendor } from "@/types/sites/vendor";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; payments: VndVendorPayment[]; vendors: VndVendor[] }
  | { kind: "error"; message: string };

/** Owns the GET /vendor-payments request client-side, same reasoning as VendorInvoiceListContainer. */
export function VendorPaymentListContainer() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [{ payments }, { vendors }] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorPaymentList(), devGetVendorList()])
        : await Promise.all([getVendorPaymentList(), getVendorList()]);
      setState({ kind: "success", payments, vendors });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view vendor payments. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading vendor payments. Try again, and contact support if the problem continues.",
      });
    }
  }, [router]);

  useEffect(() => {
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load vendor payments</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <VendorPaymentListView payments={state.payments} vendors={state.vendors} />;
}
