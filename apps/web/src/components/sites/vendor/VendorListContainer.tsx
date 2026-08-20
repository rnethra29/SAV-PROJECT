"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getVendorList, getVendorTypeOptions } from "@/lib/sites/vendors-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorList, devGetVendorTypeOptions } from "@/lib/dev-preview/vendor-fixtures";
import { VendorListView } from "./VendorListView";
import type { VndVendor, VndVendorType } from "@/types/sites/vendor";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; vendors: VndVendor[]; vendorTypes: VndVendorType[] }
  | { kind: "error"; message: string };

/**
 * Owns the GET /vendors request client-side (architecture: Supabase session
 * -> apiFetch -> Authorization: Bearer <JWT> -> backend), same reasoning as
 * ClientListContainer — a Client Component so apiFetch has a browser
 * session. Vendor types are fetched alongside so the list can show a
 * resolved "Type" column instead of a raw vendor_type_id, same pattern as
 * ClientDetailContainer resolving client_type_id.
 */
export function VendorListContainer() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [{ vendors }, vendorTypes] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorList(), devGetVendorTypeOptions()])
        : await Promise.all([getVendorList(), getVendorTypeOptions()]);
      setState({ kind: "success", vendors, vendorTypes });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view vendors. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading the vendor list. Try again, and contact support if the problem continues.",
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load vendors</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <VendorListView vendors={state.vendors} vendorTypes={state.vendorTypes} />;
}
