"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndVendorRatingCreateInput } from "@/types/sites/vendor-performance";
import type { VndPurchaseOrder } from "@/types/sites/procurement-order";

type Draft = {
  purchase_order_id: string;
  quality_rating: string;
  delivery_rating: string;
  price_rating: string;
  remarks: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const RATING_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` }));

type VendorRatingCreateFormProps = {
  purchaseOrders: VndPurchaseOrder[];
  onSubmit: (input: VndVendorRatingCreateInput) => Promise<void>;
  onCancel: () => void;
};

function emptyDraft(): Draft {
  return { purchase_order_id: "", quality_rating: "", delivery_rating: "", price_rating: "", remarks: "" };
}

/** Client-side pre-check per src/validators/vndVendorRating.validator.js#createRatingForVendor. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.quality_rating) errors.quality_rating = "Select a quality rating.";
  if (!draft.delivery_rating) errors.delivery_rating = "Select a delivery rating.";
  if (!draft.price_rating) errors.price_rating = "Select a price rating.";
  return errors;
}

function toCreateInput(draft: Draft): VndVendorRatingCreateInput {
  const input: VndVendorRatingCreateInput = {
    quality_rating: Number(draft.quality_rating),
    delivery_rating: Number(draft.delivery_rating),
    price_rating: Number(draft.price_rating),
  };
  if (draft.purchase_order_id) input.purchase_order_id = draft.purchase_order_id;
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

export function VendorRatingCreateForm({ purchaseOrders, onSubmit, onCancel }: VendorRatingCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const poOptions = purchaseOrders.map((po) => ({ value: po.po_id, label: po.po_number }));

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
          setFormError("Some fields need attention before this rating can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to rate this vendor.");
        } else {
          setFormError("Something went wrong while saving this rating. Try again.");
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
            id="rating_po_id"
            label="Purchase Order"
            placeholder="Not linked to a PO (optional)"
            options={poOptions}
            value={draft.purchase_order_id}
            onChange={(e) => setField("purchase_order_id", e.target.value)}
            disabled={status === "submitting"}
          />
          <div />
          <Select
            id="rating_quality"
            label="Quality Rating"
            placeholder="Select a rating"
            options={RATING_OPTIONS}
            value={draft.quality_rating}
            onChange={(e) => setField("quality_rating", e.target.value)}
            error={fieldErrors.quality_rating}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="rating_delivery"
            label="Delivery Rating"
            placeholder="Select a rating"
            options={RATING_OPTIONS}
            value={draft.delivery_rating}
            onChange={(e) => setField("delivery_rating", e.target.value)}
            error={fieldErrors.delivery_rating}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="rating_price"
            label="Price Rating"
            placeholder="Select a rating"
            options={RATING_OPTIONS}
            value={draft.price_rating}
            onChange={(e) => setField("price_rating", e.target.value)}
            error={fieldErrors.price_rating}
            disabled={status === "submitting"}
            required
          />
        </div>

        <TextArea
          id="rating_remarks"
          label="Remarks"
          placeholder="Optional"
          value={draft.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
          error={fieldErrors.remarks}
          disabled={status === "submitting"}
          rows={2}
        />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Rating"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
