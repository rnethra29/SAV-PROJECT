"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getVendorById, getVendorTypeOptions } from "@/lib/sites/vendors-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorById, devGetVendorTypeOptions } from "@/lib/dev-preview/vendor-fixtures";
import { VendorDetailView } from "./VendorDetailView";
import type { VndVendorDetail, VndVendorType } from "@/types/sites/vendor";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; vendor: VndVendorDetail; vendorTypes: VndVendorType[] }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

type VendorDetailContainerProps = {
  vendorId: string;
};

/**
 * Owns the GET /vendors/:id request client-side, same reasoning as
 * ClientDetailContainer — a Client Component so apiFetch has a browser
 * Supabase session to attach as a Bearer token.
 */
export function VendorDetailContainer({ vendorId }: VendorDetailContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [vendor, vendorTypes] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorById(vendorId), devGetVendorTypeOptions()])
        : await Promise.all([getVendorById(vendorId), getVendorTypeOptions()]);
      setState({ kind: "success", vendor, vendorTypes });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this vendor. Contact an administrator.",
        });
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setState({ kind: "not-found" });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading this vendor. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, vendorId]);

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
          <p className="text-sm font-medium text-text-primary">Vendor not found</p>
          <p className="text-sm text-text-secondary">This vendor may have been deleted, or the link is incorrect.</p>
        </div>
        <Button onClick={() => router.push("/sites/vendors")}>Back to Vendors</Button>
      </Panel>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load this vendor</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <VendorDetailView vendor={state.vendor} vendorTypes={state.vendorTypes} />;
}
