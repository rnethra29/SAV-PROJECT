"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndVendorBankAccountCreateInput } from "@/types/sites/vendor-bank-account";

type Draft = {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  account_type: "" | "Savings" | "Current";
  upi_id: string;
  is_primary: boolean;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const ACCOUNT_TYPE_OPTIONS = [
  { value: "Savings", label: "Savings" },
  { value: "Current", label: "Current" },
];

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function emptyDraft(): Draft {
  return {
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    account_type: "",
    upi_id: "",
    is_primary: true,
  };
}

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.account_holder_name.trim()) errors.account_holder_name = "Enter the account holder name.";
  if (!draft.bank_name.trim()) errors.bank_name = "Enter the bank name.";
  if (!draft.account_number.trim()) errors.account_number = "Enter the account number.";
  if (!draft.ifsc_code.trim()) {
    errors.ifsc_code = "Enter the IFSC code.";
  } else if (!IFSC_PATTERN.test(draft.ifsc_code.trim().toUpperCase())) {
    errors.ifsc_code = "Enter a valid 11-character IFSC code (e.g. HDFC0001234).";
  }
  return errors;
}

function toCreateInput(draft: Draft): VndVendorBankAccountCreateInput {
  const input: VndVendorBankAccountCreateInput = {
    account_holder_name: draft.account_holder_name.trim(),
    bank_name: draft.bank_name.trim(),
    account_number: draft.account_number.trim(),
    ifsc_code: draft.ifsc_code.trim().toUpperCase(),
    is_primary: draft.is_primary,
  };
  if (draft.branch.trim()) input.branch = draft.branch.trim();
  if (draft.account_type) input.account_type = draft.account_type;
  if (draft.upi_id.trim()) input.upi_id = draft.upi_id.trim();
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

type VendorBankAccountCreateFormProps = {
  onSubmit: (input: VndVendorBankAccountCreateInput) => Promise<void>;
  onCancel: () => void;
};

export function VendorBankAccountCreateForm({ onSubmit, onCancel }: VendorBankAccountCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
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
      await onSubmit(toCreateInput(draft));
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseApiError(error);
        if (error.status === 400 && parsed.code === "VALIDATION_ERROR" && parsed.details) {
          const nextFieldErrors: FieldErrors = {};
          for (const detail of parsed.details) {
            if (detail.field in draft) nextFieldErrors[detail.field as keyof Draft] = detail.message;
          }
          setFieldErrors(nextFieldErrors);
          setFormError("Some fields need attention before this bank account can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add bank accounts for this vendor.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while saving this bank account. Try again.");
        }
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  return (
    <Panel className="border-t-0 bg-background/40">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-text-primary">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="bank_account_holder_name"
            label="Account Holder Name"
            value={draft.account_holder_name}
            onChange={(e) => setField("account_holder_name", e.target.value)}
            error={fieldErrors.account_holder_name}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="bank_name"
            label="Bank Name"
            value={draft.bank_name}
            onChange={(e) => setField("bank_name", e.target.value)}
            error={fieldErrors.bank_name}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="bank_account_number"
            label="Account Number"
            value={draft.account_number}
            onChange={(e) => setField("account_number", e.target.value)}
            error={fieldErrors.account_number}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="bank_ifsc_code"
            label="IFSC Code"
            placeholder="HDFC0001234"
            value={draft.ifsc_code}
            onChange={(e) => setField("ifsc_code", e.target.value.toUpperCase())}
            error={fieldErrors.ifsc_code}
            disabled={status === "submitting"}
            maxLength={11}
            required
          />
          <TextField
            id="bank_branch"
            label="Branch"
            placeholder="Optional"
            value={draft.branch}
            onChange={(e) => setField("branch", e.target.value)}
            error={fieldErrors.branch}
            disabled={status === "submitting"}
          />
          <Select
            id="bank_account_type"
            label="Account Type"
            placeholder="Select (optional)"
            options={ACCOUNT_TYPE_OPTIONS}
            value={draft.account_type}
            onChange={(e) => setField("account_type", e.target.value as Draft["account_type"])}
            error={fieldErrors.account_type}
            disabled={status === "submitting"}
          />
          <TextField
            id="bank_upi_id"
            label="UPI ID"
            placeholder="Optional"
            value={draft.upi_id}
            onChange={(e) => setField("upi_id", e.target.value)}
            error={fieldErrors.upi_id}
            disabled={status === "submitting"}
          />
        </div>

        <Checkbox
          id="bank_is_primary"
          label="Primary account for this vendor"
          checked={draft.is_primary}
          onChange={(e) => setField("is_primary", e.target.checked)}
          disabled={status === "submitting"}
        />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Bank Account"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
