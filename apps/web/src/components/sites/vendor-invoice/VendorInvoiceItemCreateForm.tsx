"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndVendorInvoiceItemCreateInput } from "@/types/sites/vendor-invoice";
import type { VndPurchaseOrderItem } from "@/types/sites/procurement-order";

type Draft = {
  description: string;
  po_item_id: string;
  quantity: string;
  unit: string;
  rate: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

type VendorInvoiceItemCreateFormProps = {
  poItems: VndPurchaseOrderItem[];
  nextSequenceNo: number;
  onSubmit: (input: VndVendorInvoiceItemCreateInput) => Promise<void>;
  onCancel: () => void;
};

function emptyDraft(): Draft {
  return { description: "", po_item_id: "", quantity: "", unit: "", rate: "" };
}

/** Client-side pre-check per src/validators/vndVendorInvoiceItem.validator.js#createInvoiceItemForInvoice. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.description.trim()) errors.description = "Enter a description.";
  if (!draft.quantity.trim() || Number(draft.quantity) <= 0) errors.quantity = "Enter a quantity greater than zero.";
  if (!draft.rate.trim() || Number(draft.rate) < 0) errors.rate = "Enter a valid rate.";
  return errors;
}

function toCreateInput(draft: Draft, sequenceNo: number): VndVendorInvoiceItemCreateInput {
  const input: VndVendorInvoiceItemCreateInput = {
    description: draft.description.trim(),
    quantity: Number(draft.quantity),
    rate: Number(draft.rate),
    sequence_no: sequenceNo,
  };
  if (draft.po_item_id) input.po_item_id = draft.po_item_id;
  if (draft.unit.trim()) input.unit = draft.unit.trim();
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

export function VendorInvoiceItemCreateForm({ poItems, nextSequenceNo, onSubmit, onCancel }: VendorInvoiceItemCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const poItemOptions = poItems.map((item) => ({ value: item.po_item_id, label: `${item.item_name} (ordered ${item.quantity} ${item.unit})` }));

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function selectPoItem(poItemId: string) {
    const item = poItems.find((i) => i.po_item_id === poItemId);
    setDraft((prev) => ({
      ...prev,
      po_item_id: poItemId,
      description: item ? item.item_name : prev.description,
      unit: item ? item.unit : prev.unit,
      rate: item ? item.unit_price : prev.rate,
    }));
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
      await onSubmit(toCreateInput(draft, nextSequenceNo));
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseApiError(error);
        if (error.status === 400 && parsed.code === "VALIDATION_ERROR" && parsed.details) {
          const nextFieldErrors: FieldErrors = {};
          for (const detail of parsed.details) {
            if (detail.field in draft) nextFieldErrors[detail.field as keyof Draft] = detail.message;
          }
          setFieldErrors(nextFieldErrors);
          setFormError("Some fields need attention before this line can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add lines to this invoice.");
        } else {
          setFormError("Something went wrong while saving this line. Try again.");
        }
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  const previewLineAmount = (Number(draft.quantity) || 0) * (Number(draft.rate) || 0);

  return (
    <Panel className="border-t-0 bg-background/40">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-text-primary">{formError}</p>
          </div>
        )}

        {poItemOptions.length > 0 && (
          <Select
            id="invoice_item_po_item"
            label="Reconcile against PO Item"
            placeholder="Not linked to a PO item (optional)"
            options={poItemOptions}
            value={draft.po_item_id}
            onChange={(e) => selectPoItem(e.target.value)}
            disabled={status === "submitting"}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="invoice_item_description"
            label="Description"
            value={draft.description}
            onChange={(e) => setField("description", e.target.value)}
            error={fieldErrors.description}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="invoice_item_unit"
            label="Unit"
            placeholder="Optional"
            value={draft.unit}
            onChange={(e) => setField("unit", e.target.value)}
            error={fieldErrors.unit}
            disabled={status === "submitting"}
          />
          <TextField
            id="invoice_item_quantity"
            label="Quantity"
            type="number"
            min={0}
            value={draft.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            error={fieldErrors.quantity}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="invoice_item_rate"
            label="Rate"
            type="number"
            min={0}
            value={draft.rate}
            onChange={(e) => setField("rate", e.target.value)}
            error={fieldErrors.rate}
            disabled={status === "submitting"}
            required
          />
        </div>

        <p className="text-xs text-text-secondary">
          Line amount (quantity × rate): <span className="font-medium text-text-primary">₹{previewLineAmount.toLocaleString("en-IN")}</span>
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Line"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
