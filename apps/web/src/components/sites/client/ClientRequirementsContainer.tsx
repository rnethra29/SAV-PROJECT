"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createClientRequirement, getClientRequirements } from "@/lib/sites/client-requirements-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateClientRequirement, devGetClientRequirements } from "@/lib/dev-preview/client-fixtures";
import { ClientRequirementCreateForm } from "./ClientRequirementCreateForm";
import { ClientRequirementsListView } from "./ClientRequirementsListView";
import type { ClmClientRequirement, ClmClientRequirementCreateInput } from "@/types/sites/requirement";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; requirements: ClmClientRequirement[] }
  | { kind: "error"; message: string };

type ClientRequirementsContainerProps = {
  clientId: string;
};

/**
 * Client 360 Requirements section. Same shape as ClientDocumentsContainer —
 * a list panel with a toggleable inline create form — backed by the real
 * nested GET/POST /clients/:clientId/requirements endpoints
 * (src/routes/clmClient.routes.js:59-66). Client Component because
 * apiFetch's Bearer token only exists in a browser session.
 */
export function ClientRequirementsContainer({ clientId }: ClientRequirementsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const { requirements } = DEV_FIXTURE_MODE
        ? await devGetClientRequirements(clientId)
        : await getClientRequirements(clientId);
      setState({ kind: "success", requirements });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this client's requirements. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading requirements. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, clientId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: ClmClientRequirementCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateClientRequirement(clientId, input);
    } else {
      await createClientRequirement(clientId, input);
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load requirements</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { requirements } = state;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Requirements</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Requirement"}
          </Button>
        </div>

        <ClientRequirementsListView requirements={requirements} />
      </Panel>

      {isFormOpen && (
        <ClientRequirementCreateForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
