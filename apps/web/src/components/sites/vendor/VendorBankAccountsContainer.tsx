"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorBankAccount, getVendorBankAccounts } from "@/lib/sites/vendor-bank-accounts-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorBankAccount, devGetVendorBankAccounts } from "@/lib/dev-preview/vendor-fixtures";
import { VendorBankAccountCreateForm } from "./VendorBankAccountCreateForm";
import { VendorBankAccountsListView } from "./VendorBankAccountsListView";
import type { VndVendorBankAccount, VndVendorBankAccountCreateInput } from "@/types/sites/vendor-bank-account";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; bankAccounts: VndVendorBankAccount[] }
  | { kind: "error"; message: string };

type VendorBankAccountsContainerProps = {
  vendorId: string;
};

/**
 * Vendor 360 Bank Accounts section. account_number/upi_id arrive already
 * masked from the backend (architecture doc §20) — this list never attempts
 * to reveal the full value, matching the real GET endpoint's contract.
 */
export function VendorBankAccountsContainer({ vendorId }: VendorBankAccountsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const bankAccounts = DEV_FIXTURE_MODE
        ? await devGetVendorBankAccounts(vendorId)
        : await getVendorBankAccounts(vendorId);
      setState({ kind: "success", bankAccounts });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this vendor's bank accounts. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading bank accounts. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, vendorId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: VndVendorBankAccountCreateInput) {
    if (DEV_FIXTURE_MODE) {
      await devCreateVendorBankAccount(vendorId, input);
    } else {
      await createVendorBankAccount(vendorId, input);
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
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load bank accounts</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { bankAccounts } = state;

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Bank Accounts</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Bank Account"}
          </Button>
        </div>

        <VendorBankAccountsListView bankAccounts={bankAccounts} />
      </Panel>

      {isFormOpen && (
        <VendorBankAccountCreateForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
