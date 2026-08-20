/**
 * vnd_vendor_bank_account, per architecture doc §6.8 (sensitive — reveal
 * gated behind a separate permissioned endpoint per doc §20) and
 * src/validators/vndVendorBankAccount.validator.js.
 */

export type VndVendorBankAccount = {
  bank_account_id: string;
  vendor_id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string | null;
  account_type: "Savings" | "Current" | null;
  upi_id: string | null;
  is_primary: boolean;
  is_verified: boolean;
  verified_at: string | null;
};

/** POST /vendors/:vendorId/bank-accounts body, per `createBankAccountForVendor` schema. */
export type VndVendorBankAccountCreateInput = {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch?: string;
  account_type?: "Savings" | "Current";
  upi_id?: string;
  is_primary: boolean;
};
