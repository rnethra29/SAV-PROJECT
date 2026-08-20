"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getVendorList } from "@/lib/sites/vendors-api";
import { getProjectOptions } from "@/lib/sites/projects-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorList } from "@/lib/dev-preview/vendor-fixtures";
import { devGetProjectOptions } from "@/lib/dev-preview/procurement-fixtures";
import { ProcurementOrderCreateForm } from "./ProcurementOrderCreateForm";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; vendors: VndVendor[]; projects: ClmProjectLookup[] }
  | { kind: "error"; message: string };

export function ProcurementOrderCreateContainer() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [{ vendors }, projects] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetVendorList(), devGetProjectOptions()])
        : await Promise.all([getVendorList(), getProjectOptions()]);
      setState({ kind: "success", vendors, projects });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to create purchase orders. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading this form. Try again, and contact support if the problem continues.",
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
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load this form</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return <ProcurementOrderCreateForm vendors={state.vendors} projects={state.projects} />;
}
