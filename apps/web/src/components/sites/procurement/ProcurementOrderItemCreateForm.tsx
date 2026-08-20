"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndPurchaseOrderItemCreateInput } from "@/types/sites/procurement-order";

type Draft = {
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  discount_amount: string;
  tax_percentage: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

type ProcurementOrderItemCreateFormProps = {
  nextSequenceNo: number;
  onSubmit: (input: VndPurchaseOrderItemCreateInput) => Promise<void>;
  onCancel: () => void;
};

function emptyDraft(): Draft {
  return { item_name: "", description: "", quantity: "", unit: "", unit_price: "", discount_amount: "0", tax_percentage: "0" };
}

/** Client-side pre-check per src/validators/vndPurchaseOrderItem.validator.js#createItemForPo. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.item_name.trim()) errors.item_name = "Enter the item name.";
  if (!draft.unit.trim()) errors.unit = "Enter the unit of measure.";
  if (!draft.quantity.trim() || Number(draft.quantity) <= 0) errors.quantity = "Enter a quantity greater than zero.";
  if (!draft.unit_price.trim() || Number(draft.unit_price) < 0) errors.unit_price = "Enter a valid unit price.";
  if (draft.discount_amount.trim() && Number(draft.discount_amount) < 0) errors.discount_amount = "Discount cannot be negative.";
  if (draft.tax_percentage.trim() && Number(draft.tax_percentage) < 0) errors.tax_percentage = "Tax rate cannot be negative.";
  return errors;
}

function toCreateInput(draft: Draft, sequenceNo: number): VndPurchaseOrderItemCreateInput {
  const input: VndPurchaseOrderItemCreateInput = {
    item_name: draft.item_name.trim(),
    quantity: Number(draft.quantity),
    unit: draft.unit.trim(),
    unit_price: Number(draft.unit_price),
    discount_amount: draft.discount_amount.trim() ? Number(draft.discount_amount) : 0,
    tax_percentage: draft.tax_percentage.trim() ? Number(draft.tax_percentage) : 0,
    sequence_no: sequenceNo,
  };
  if (draft.description.trim()) input.description = draft.description.trim();
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

export function ProcurementOrderItemCreateForm({ nextSequenceNo, onSubmit, onCancel }: ProcurementOrderItemCreateFormProps) {
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
          setFormError("Some fields need attention before this line item can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add items to this purchase order.");
        } else {
          setFormError("Something went wrong while saving this item. Try again.");
        }
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  const quantity = Number(draft.quantity) || 0;
  const unitPrice = Number(draft.unit_price) || 0;
  const discount = Number(draft.discount_amount) || 0;
  const previewLineAmount = quantity * unitPrice - discount;

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
            id="po_item_name"
            label="Item Name"
            value={draft.item_name}
            onChange={(e) => setField("item_name", e.target.value)}
            error={fieldErrors.item_name}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="po_item_unit"
            label="Unit"
            placeholder="e.g. Bag, MT, Month"
            value={draft.unit}
            onChange={(e) => setField("unit", e.target.value)}
            error={fieldErrors.unit}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="po_item_quantity"
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
            id="po_item_unit_price"
            label="Unit Price"
            type="number"
            min={0}
            value={draft.unit_price}
            onChange={(e) => setField("unit_price", e.target.value)}
            error={fieldErrors.unit_price}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="po_item_discount"
            label="Discount Amount"
            type="number"
            min={0}
            value={draft.discount_amount}
            onChange={(e) => setField("discount_amount", e.target.value)}
            error={fieldErrors.discount_amount}
            disabled={status === "submitting"}
          />
          <TextField
            id="po_item_tax"
            label="Tax %"
            type="number"
            min={0}
            value={draft.tax_percentage}
            onChange={(e) => setField("tax_percentage", e.target.value)}
            error={fieldErrors.tax_percentage}
            disabled={status === "submitting"}
          />
        </div>

        <TextArea
          id="po_item_description"
          label="Description"
          placeholder="Optional"
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
          error={fieldErrors.description}
          disabled={status === "submitting"}
          rows={2}
        />

        <p className="text-xs text-text-secondary">
          Line amount (quantity × unit price − discount): <span className="font-medium text-text-primary">₹{previewLineAmount.toLocaleString("en-IN")}</span>
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Item"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
