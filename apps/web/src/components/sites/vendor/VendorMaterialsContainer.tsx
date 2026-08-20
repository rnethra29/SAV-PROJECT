"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorMaterial, getMaterialCategoryOptions, getVendorMaterials } from "@/lib/sites/vendor-materials-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import {
  devCreateVendorMaterial,
  devGetMaterialCategoryOptions,
  devGetVendorMaterials,
} from "@/lib/dev-preview/vendor-fixtures";
import { VendorMaterialCreateForm } from "./VendorMaterialCreateForm";
import { VendorMaterialsListView } from "./VendorMaterialsListView";
import type { VndMaterialCategory, VndMaterialService, VndMaterialServiceCreateInput } from "@/types/sites/material-service";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; materials: VndMaterialService[]; categories: VndMaterialCategory[] }
  | { kind: "error"; message: string };

type VendorMaterialsContainerProps = {
  vendorId: string;
};

/**
 * Vendor 360 Materials/Services section — the vendor's catalog
 * (vnd_material_service, architecture doc §6.9). Same list-panel shape as
 * VendorContactsContainer, backed by the real nested
 * GET/POST /vendors/:vendorId/materials endpoints
 * (src/routes/vndVendor.routes.js:64-71).
 */
export function VendorMaterialsContainer({ vendorId }: VendorMaterialsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [materials, categories] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorMaterials(vendorId), devGetMaterialCategoryOptions()])
        : await Promise.all([getVendorMaterials(vendorId), getMaterialCategoryOptions()]);
      setState({ kind: "success", materials, categories });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this vendor's catalog. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading the catalog. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, vendorId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: VndMaterialServiceCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateVendorMaterial(vendorId, input);
    } else {
      await createVendorMaterial(vendorId, input);
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load the catalog</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { materials, categories } = state;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Materials / Services</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Item"}
          </Button>
        </div>

        <VendorMaterialsListView materials={materials} categories={categories} />
      </Panel>

      {isFormOpen && (
        <VendorMaterialCreateForm categories={categories} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
