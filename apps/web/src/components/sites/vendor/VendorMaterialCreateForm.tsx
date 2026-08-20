"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndMaterialCategory, VndMaterialServiceCreateInput } from "@/types/sites/material-service";

type Draft = {
  item_name: string;
  material_category_id: string;
  description: string;
  unit: string;
  standard_rate: string;
  tax_rate: string;
  minimum_order_quantity: string;
  delivery_time_days: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

function emptyDraft(): Draft {
  return {
    item_name: "",
    material_category_id: "",
    description: "",
    unit: "",
    standard_rate: "",
    tax_rate: "0",
    minimum_order_quantity: "",
    delivery_time_days: "",
  };
}

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.item_name.trim()) errors.item_name = "Enter the item name.";
  if (!draft.unit.trim()) errors.unit = "Enter the unit of measure.";
  if (draft.standard_rate.trim() && Number(draft.standard_rate) < 0) errors.standard_rate = "Rate cannot be negative.";
  if (draft.tax_rate.trim() && Number(draft.tax_rate) < 0) errors.tax_rate = "Tax rate cannot be negative.";
  return errors;
}

function toCreateInput(draft: Draft): VndMaterialServiceCreateInput {
  const input: VndMaterialServiceCreateInput = {
    item_name: draft.item_name.trim(),
    unit: draft.unit.trim(),
    tax_rate: draft.tax_rate.trim() ? Number(draft.tax_rate) : 0,
    is_active: true,
  };
  if (draft.material_category_id) input.material_category_id = draft.material_category_id;
  if (draft.description.trim()) input.description = draft.description.trim();
  if (draft.standard_rate.trim()) input.standard_rate = Number(draft.standard_rate);
  if (draft.minimum_order_quantity.trim()) input.minimum_order_quantity = Number(draft.minimum_order_quantity);
  if (draft.delivery_time_days.trim()) input.delivery_time_days = Number(draft.delivery_time_days);
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

type VendorMaterialCreateFormProps = {
  categories: VndMaterialCategory[];
  onSubmit: (input: VndMaterialServiceCreateInput) => Promise<void>;
  onCancel: () => void;
};

export function VendorMaterialCreateForm({ categories, onSubmit, onCancel }: VendorMaterialCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const categoryOptions = categories.map((c) => ({ value: c.material_category_id, label: c.category_name }));

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
          setFormError("Some fields need attention before this item can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add catalog items for this vendor.");
        } else {
          setFormError("Something went wrong while saving this item. Try again.");
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
            id="material_item_name"
            label="Item Name"
            value={draft.item_name}
            onChange={(e) => setField("item_name", e.target.value)}
            error={fieldErrors.item_name}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="material_category_id"
            label="Category"
            placeholder="Select a category (optional)"
            options={categoryOptions}
            value={draft.material_category_id}
            onChange={(e) => setField("material_category_id", e.target.value)}
            error={fieldErrors.material_category_id}
            disabled={status === "submitting"}
          />
          <TextField
            id="material_unit"
            label="Unit"
            placeholder="e.g. Bag, MT, Nos"
            value={draft.unit}
            onChange={(e) => setField("unit", e.target.value)}
            error={fieldErrors.unit}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="material_standard_rate"
            label="Standard Rate"
            type="number"
            min={0}
            placeholder="Optional"
            value={draft.standard_rate}
            onChange={(e) => setField("standard_rate", e.target.value)}
            error={fieldErrors.standard_rate}
            disabled={status === "submitting"}
          />
          <TextField
            id="material_tax_rate"
            label="Tax Rate %"
            type="number"
            min={0}
            value={draft.tax_rate}
            onChange={(e) => setField("tax_rate", e.target.value)}
            error={fieldErrors.tax_rate}
            disabled={status === "submitting"}
          />
          <TextField
            id="material_min_order_qty"
            label="Minimum Order Quantity"
            type="number"
            min={0}
            placeholder="Optional"
            value={draft.minimum_order_quantity}
            onChange={(e) => setField("minimum_order_quantity", e.target.value)}
            error={fieldErrors.minimum_order_quantity}
            disabled={status === "submitting"}
          />
          <TextField
            id="material_delivery_time"
            label="Delivery Time (days)"
            type="number"
            min={0}
            placeholder="Optional"
            value={draft.delivery_time_days}
            onChange={(e) => setField("delivery_time_days", e.target.value)}
            error={fieldErrors.delivery_time_days}
            disabled={status === "submitting"}
          />
        </div>

        <TextArea
          id="material_description"
          label="Description"
          placeholder="Optional"
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
          error={fieldErrors.description}
          disabled={status === "submitting"}
          rows={3}
        />

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
