"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendorPayment } from "@/lib/sites/vendor-payments-api";
import { getVendorBankAccounts } from "@/lib/sites/vendor-bank-accounts-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorPayment } from "@/lib/dev-preview/vendor-payment-fixtures";
import { devGetVendorBankAccounts } from "@/lib/dev-preview/vendor-fixtures";
import type { VndPaymentMethod, VndVendorPaymentCreateInput } from "@/types/sites/vendor-payment";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";
import type { VndVendorBankAccount } from "@/types/sites/vendor-bank-account";

type VendorPaymentCreateFormProps = {
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
};

type Draft = {
  payment_reference_number: string;
  vendor_id: string;
  project_id: string;
  bank_account_id: string;
  payment_date: string;
  amount: string;
  payment_method: VndPaymentMethod | "";
  transaction_reference: string;
  remarks: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const PAYMENT_METHOD_OPTIONS: { value: VndPaymentMethod; label: string }[] = [
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  { value: "Cash", label: "Cash" },
  { value: "Other", label: "Other" },
];

function emptyDraft(): Draft {
  return {
    payment_reference_number: "",
    vendor_id: "",
    project_id: "",
    bank_account_id: "",
    payment_date: "",
    amount: "",
    payment_method: "",
    transaction_reference: "",
    remarks: "",
  };
}

/** Client-side pre-check per src/validators/vndVendorPayment.validator.js#createPayment. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.payment_reference_number.trim()) errors.payment_reference_number = "Enter a payment reference number.";
  if (!draft.vendor_id) errors.vendor_id = "Select a vendor.";
  if (!draft.payment_date) errors.payment_date = "Enter the payment date.";
  if (!draft.amount.trim() || Number(draft.amount) <= 0) errors.amount = "Enter an amount greater than zero.";
  if (!draft.payment_method) errors.payment_method = "Select a payment method.";
  return errors;
}

function toCreateInput(draft: Draft): VndVendorPaymentCreateInput {
  const input: VndVendorPaymentCreateInput = {
    payment_reference_number: draft.payment_reference_number.trim(),
    vendor_id: draft.vendor_id,
    payment_date: draft.payment_date,
    amount: Number(draft.amount),
    payment_method: draft.payment_method as VndPaymentMethod,
  };
  if (draft.project_id) input.project_id = draft.project_id;
  if (draft.bank_account_id) input.bank_account_id = draft.bank_account_id;
  if (draft.transaction_reference.trim()) input.transaction_reference = draft.transaction_reference.trim();
  if (draft.remarks.trim()) input.remarks = draft.remarks.trim();
  return input;
}

function parseApiError(error: ApiError): { message: string; code?: string; details?: { field: string; message: string }[] } {
  try {
    const body = JSON.parse(error.message);
    return { message: body.message ?? error.message, code: body.code, details: body.details };
  } catch {
    return { message: error.message || "Something went wrong." };
  }
}

const sectionHeadingClasses = "text-sm font-semibold text-text-primary";
const gridClasses = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export function VendorPaymentCreateForm({ vendors, projects }: VendorPaymentCreateFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [bankAccounts, setBankAccounts] = useState<VndVendorBankAccount[]>([]);

  const vendorOptions = vendors.map((v) => ({ value: v.vendor_id, label: `${v.vendor_code} — ${v.vendor_name}` }));
  const projectOptions = projects.map((p) => ({ value: p.project_id, label: `${p.project_code} — ${p.project_name}` }));
  const bankAccountOptions = bankAccounts.map((a) => ({
    value: a.bank_account_id,
    label: `${a.bank_name} — ${a.account_number}${a.is_primary ? " (Primary)" : ""}`,
  }));

  // A payment's bank_account_id must belong to the selected vendor (backend
  // check in vndVendorPayment.service.js#create) — reload the option list
  // whenever the vendor changes, and clear any stale selection.
  useEffect(() => {
    let cancelled = false;
    if (!draft.vendor_id) {
      Promise.resolve().then(() => {
        if (!cancelled) setBankAccounts([]);
      });
      return () => {
        cancelled = true;
      };
    }
    (DEV_FIXTURE_MODE ? devGetVendorBankAccounts(draft.vendor_id) : getVendorBankAccounts(draft.vendor_id)).then((accounts) => {
      if (!cancelled) setBankAccounts(accounts);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.vendor_id]);

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value, ...(key === "vendor_id" ? { bank_account_id: "" } : {}) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const errors = validateDraft(draft);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");
    try {
      // Development fixture mode: "creates" only update the in-memory dev
      // store — never a real POST /vendor-payments call, never persisted.
      const created = DEV_FIXTURE_MODE
        ? await devCreateVendorPayment(toCreateInput(draft))
        : await createVendorPayment(toCreateInput(draft));
      router.replace(`/sites/vendor-payments/${created.vendor_payment_id}`);
      return;
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseApiError(error);

        if (error.status === 400 && parsed.code === "VALIDATION_ERROR" && parsed.details) {
          const nextFieldErrors: FieldErrors = {};
          for (const detail of parsed.details) {
            if (detail.field in draft) nextFieldErrors[detail.field as keyof Draft] = detail.message;
          }
          setFieldErrors(nextFieldErrors);
          setFormError("Some fields need attention before this payment can be saved.");
        } else if (error.status === 401) {
          router.replace("/login");
          return;
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to create vendor payments. Contact an administrator.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while creating the payment. Try again, and contact support if the problem continues.");
        }
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-text-primary">{formError}</p>
        </div>
      )}

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Payment Identity</h2>
        <div className={gridClasses}>
          <TextField
            id="payment_reference_number"
            label="Payment Reference Number"
            placeholder="PAY-2026-0042"
            value={draft.payment_reference_number}
            onChange={(e) => setField("payment_reference_number", e.target.value)}
            error={fieldErrors.payment_reference_number}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="payment_date"
            label="Payment Date"
            type="date"
            value={draft.payment_date}
            onChange={(e) => setField("payment_date", e.target.value)}
            error={fieldErrors.payment_date}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="vendor_id"
            label="Vendor"
            placeholder="Select a vendor"
            options={vendorOptions}
            value={draft.vendor_id}
            onChange={(e) => setField("vendor_id", e.target.value)}
            error={fieldErrors.vendor_id}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="project_id"
            label="Project"
            placeholder="Not linked to a project (optional)"
            options={projectOptions}
            value={draft.project_id}
            onChange={(e) => setField("project_id", e.target.value)}
            error={fieldErrors.project_id}
            disabled={status === "submitting"}
          />
          <Select
            id="bank_account_id"
            label="Bank Account"
            placeholder={draft.vendor_id ? "Select an account (optional)" : "Select a vendor first"}
            options={bankAccountOptions}
            value={draft.bank_account_id}
            onChange={(e) => setField("bank_account_id", e.target.value)}
            error={fieldErrors.bank_account_id}
            disabled={status === "submitting" || !draft.vendor_id}
          />
          <Select
            id="payment_method"
            label="Payment Method"
            placeholder="Select a method"
            options={PAYMENT_METHOD_OPTIONS}
            value={draft.payment_method}
            onChange={(e) => setField("payment_method", e.target.value as VndPaymentMethod)}
            error={fieldErrors.payment_method}
            disabled={status === "submitting"}
            required
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Amount</h2>
        <div className={gridClasses}>
          <TextField
            id="amount"
            label="Amount"
            type="number"
            min={0}
            value={draft.amount}
            onChange={(e) => setField("amount", e.target.value)}
            error={fieldErrors.amount}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="transaction_reference"
            label="Transaction Reference"
            placeholder="Optional — UTR, cheque number, etc."
            value={draft.transaction_reference}
            onChange={(e) => setField("transaction_reference", e.target.value)}
            error={fieldErrors.transaction_reference}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Remarks</h2>
        <TextArea
          id="remarks"
          label="Internal Remarks"
          placeholder="Optional"
          value={draft.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
          error={fieldErrors.remarks}
          disabled={status === "submitting"}
          rows={3}
        />
      </Panel>

      <p className="text-xs text-text-secondary">
        Payments are created as &quot;Pending&quot;. Allocate this payment against one or more invoices, and approve
        it, on the payment&apos;s own page after it&apos;s created.
      </p>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={status === "submitting"}>
          Cancel
        </Button>
        <Button type="submit" isLoading={status === "submitting"}>
          {status === "submitting" ? "Creating…" : "Create Vendor Payment"}
        </Button>
      </div>
    </form>
  );
}
