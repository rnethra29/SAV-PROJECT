import { apiFetch } from "@/lib/api-client";
import type { VndVendorBankAccount, VndVendorBankAccountCreateInput } from "@/types/sites/vendor-bank-account";

type VndBankAccountListResponse = {
  success: boolean;
  message: string;
  data: VndVendorBankAccount[];
};

type VndBankAccountResponse = {
  success: boolean;
  message: string;
  data: VndVendorBankAccount;
};

/**
 * GET /vendors/:vendorId/bank-accounts — src/routes/vndVendor.routes.js:54.
 * account_number/upi_id are masked server-side in list responses per
 * architecture doc §20 — full values are only available via the separately
 * permissioned GET /vendor-bank-accounts/:id/reveal endpoint, not called
 * from this list view.
 */
export async function getVendorBankAccounts(vendorId: string): Promise<VndVendorBankAccount[]> {
  const response = await apiFetch<VndBankAccountListResponse>(`/vendors/${vendorId}/bank-accounts`);
  return response.data;
}

/**
 * POST /vendors/:vendorId/bank-accounts — src/routes/vndVendor.routes.js:55-61,
 * requires Procurement Manager/Finance Manager and validates against
 * src/validators/vndVendorBankAccount.validator.js#createBankAccountForVendor.
 */
export async function createVendorBankAccount(
  vendorId: string,
  input: VndVendorBankAccountCreateInput,
): Promise<VndVendorBankAccount> {
  const response = await apiFetch<VndBankAccountResponse>(`/vendors/${vendorId}/bank-accounts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}
