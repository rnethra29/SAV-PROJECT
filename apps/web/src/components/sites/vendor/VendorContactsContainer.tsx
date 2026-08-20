"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorContact, getVendorContacts } from "@/lib/sites/vendor-contacts-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorContact, devGetVendorContacts } from "@/lib/dev-preview/vendor-fixtures";
import { VendorContactCreateForm } from "./VendorContactCreateForm";
import { VendorContactsListView } from "./VendorContactsListView";
import type { VndVendorContact, VndVendorContactCreateInput } from "@/types/sites/vendor-contact";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; contacts: VndVendorContact[] }
  | { kind: "error"; message: string };

type VendorContactsContainerProps = {
  vendorId: string;
};

/**
 * Vendor 360 Contacts section. Same shape as ClientContactsContainer — a
 * list panel with a toggleable inline create form — backed by the real
 * nested GET/POST /vendors/:vendorId/contacts endpoints
 * (src/routes/vndVendor.routes.js:44-51).
 */
export function VendorContactsContainer({ vendorId }: VendorContactsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const contacts = DEV_FIXTURE_MODE ? await devGetVendorContacts(vendorId) : await getVendorContacts(vendorId);
      setState({ kind: "success", contacts });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this vendor's contacts. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading contacts. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, vendorId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: VndVendorContactCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateVendorContact(vendorId, input);
    } else {
      await createVendorContact(vendorId, input);
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load contacts</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { contacts } = state;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Contacts</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Contact"}
          </Button>
        </div>

        <VendorContactsListView contacts={contacts} />
      </Panel>

      {isFormOpen && (
        <VendorContactCreateForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
