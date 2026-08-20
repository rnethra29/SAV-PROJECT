"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { getClientTypeOptions, getIndustryOptions } from "@/lib/sites/clients-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetClientTypeOptions, devGetIndustryOptions } from "@/lib/dev-preview/client-fixtures";
import { ClientCreateForm } from "./ClientCreateForm";
import type { ClmClientType, ClmIndustry } from "@/types/sites/client";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; clientTypes: ClmClientType[]; industries: ClmIndustry[] }
  | { kind: "error"; message: string };

/**
 * Loads the create-form's lookup options (client types, industries)
 * client-side, same reasoning as ClientListContainer: GET /client-lookups/*
 * also sits behind `authenticate` (src/routes/clmLookup.routes.js:17), so
 * it needs the browser's Supabase session and can't be fetched from a
 * Server Component.
 */
export function ClientCreateContainer() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [clientTypes, industries] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetClientTypeOptions(), devGetIndustryOptions()])
        : await Promise.all([getClientTypeOptions(), getIndustryOptions()]);
      setState({ kind: "success", clientTypes, industries });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to create clients. Contact an administrator.",
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

  return <ClientCreateForm clientTypes={state.clientTypes} industries={state.industries} />;
}
