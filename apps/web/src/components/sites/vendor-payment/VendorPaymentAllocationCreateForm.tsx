"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndVendorPaymentAllocationCreateInput } from "@/types/sites/vendor-payment";
import type { VndVendorInvoice } from "@/types/sites/vendor-invoice";

type Draft = {
  vendor_invoice_id: string;
  allocated_amount: string;
  allocated_date: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

type VendorPaymentAllocationCreateFormProps = {
  invoices: VndVendorInvoice[];
  onSubmit: (input: VndVendorPaymentAllocationCreateInput) => Promise<void>;
  onCancel: () => void;
};

function emptyDraft(): Draft {
  return { vendor_invoice_id: "", allocated_amount: "", allocated_date: "" };
}

/** Client-side pre-check per src/validators/vndVendorPayment.validator.js#createAllocationForPayment. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.vendor_invoice_id) errors.vendor_invoice_id = "Select an invoice.";
  if (!draft.allocated_amount.trim() || Number(draft.allocated_amount) <= 0) {
    errors.allocated_amount = "Enter an amount greater than zero.";
  }
  if (!draft.allocated_date) errors.allocated_date = "Enter the allocation date.";
  return errors;
}

function toCreateInput(draft: Draft): VndVendorPaymentAllocationCreateInput {
  return {
    vendor_invoice_id: draft.vendor_invoice_id,
    allocated_amount: Number(draft.allocated_amount),
    allocated_date: draft.allocated_date,
  };
}

function parseApiError(error: ApiError): { message: string; code?: string; details?: { field: string; message: string }[] } {
  try {
    const body = JSON.parse(error.message);
    return { message: body.message ?? error.message, code: body.code, details: body.details };
  } catch {
    return { message: error.message || "Something went wrong." };
  }
}

export function VendorPaymentAllocationCreateForm({ invoices, onSubmit, onCancel }: VendorPaymentAllocationCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const invoiceOptions = invoices.map((i) => ({ value: i.vendor_invoice_id, label: `${i.invoice_number} (${i.total_amount})` }));

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
          setFormError("Some fields need attention before this allocation can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to allocate this payment.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while saving this allocation. Try again.");
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
          <Select
            id="allocation_invoice_id"
            label="Vendor Invoice"
            placeholder="Select an invoice"
            options={invoiceOptions}
            value={draft.vendor_invoice_id}
            onChange={(e) => setField("vendor_invoice_id", e.target.value)}
            error={fieldErrors.vendor_invoice_id}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="allocation_date"
            label="Allocated Date"
            type="date"
            value={draft.allocated_date}
            onChange={(e) => setField("allocated_date", e.target.value)}
            error={fieldErrors.allocated_date}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="allocation_amount"
            label="Allocated Amount"
            type="number"
            min={0}
            value={draft.allocated_amount}
            onChange={(e) => setField("allocated_amount", e.target.value)}
            error={fieldErrors.allocated_amount}
            disabled={status === "submitting"}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Allocation"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
