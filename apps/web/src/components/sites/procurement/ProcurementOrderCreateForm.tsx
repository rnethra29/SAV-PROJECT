"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createProcurementOrder } from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateProcurementOrder } from "@/lib/dev-preview/procurement-fixtures";
import type { VndPurchaseOrderCreateInput } from "@/types/sites/procurement-order";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type ProcurementOrderCreateFormProps = {
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
};

type Draft = {
  po_number: string;
  project_id: string;
  vendor_id: string;
  po_date: string;
  expected_delivery_date: string;
  delivery_location: string;
  payment_terms: string;
  remarks: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

function emptyDraft(): Draft {
  return {
    po_number: "",
    project_id: "",
    vendor_id: "",
    po_date: "",
    expected_delivery_date: "",
    delivery_location: "",
    payment_terms: "",
    remarks: "",
  };
}

/** Client-side pre-check per src/validators/vndPurchaseOrder.validator.js#createPurchaseOrder. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.po_number.trim()) errors.po_number = "Enter a PO number.";
  if (!draft.project_id) errors.project_id = "Select a project.";
  if (!draft.vendor_id) errors.vendor_id = "Select a vendor.";
  if (!draft.po_date) errors.po_date = "Enter the PO date.";
  return errors;
}

function toCreateInput(draft: Draft): VndPurchaseOrderCreateInput {
  const input: VndPurchaseOrderCreateInput = {
    po_number: draft.po_number.trim(),
    project_id: draft.project_id,
    vendor_id: draft.vendor_id,
    po_date: draft.po_date,
  };
  if (draft.expected_delivery_date) input.expected_delivery_date = draft.expected_delivery_date;
  if (draft.delivery_location.trim()) input.delivery_location = draft.delivery_location.trim();
  if (draft.payment_terms.trim()) input.payment_terms = draft.payment_terms.trim();
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

export function ProcurementOrderCreateForm({ vendors, projects }: ProcurementOrderCreateFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const projectOptions = projects.map((p) => ({ value: p.project_id, label: `${p.project_code} — ${p.project_name}` }));
  const vendorOptions = vendors.map((v) => ({ value: v.vendor_id, label: `${v.vendor_code} — ${v.vendor_name}` }));

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
      // Development fixture mode: "creates" only update the in-memory dev
      // store (procurement-fixtures.ts) — never a real POST
      // /procurement-orders call, never persisted. Header only — line items
      // are added on the PO's own detail page next, same two-step flow the
      // real API requires (header create, then nested item POSTs).
      const created = DEV_FIXTURE_MODE
        ? await devCreateProcurementOrder(toCreateInput(draft))
        : await createProcurementOrder(toCreateInput(draft));
      router.replace(`/sites/procurement/${created.po_id}`);
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
          setFormError("Some fields need attention before this purchase order can be created.");
        } else if (error.status === 401) {
          router.replace("/login");
          return;
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to create purchase orders. Contact an administrator.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while creating the purchase order. Try again, and contact support if the problem continues.");
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
        <h2 className={sectionHeadingClasses}>Purchase Order Identity</h2>
        <div className={gridClasses}>
          <TextField
            id="po_number"
            label="PO Number"
            placeholder="PO-2026-0042"
            value={draft.po_number}
            onChange={(e) => setField("po_number", e.target.value)}
            error={fieldErrors.po_number}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="po_date"
            label="PO Date"
            type="date"
            value={draft.po_date}
            onChange={(e) => setField("po_date", e.target.value)}
            error={fieldErrors.po_date}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="project_id"
            label="Project"
            placeholder="Select a project"
            options={projectOptions}
            value={draft.project_id}
            onChange={(e) => setField("project_id", e.target.value)}
            error={fieldErrors.project_id}
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
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Delivery &amp; Payment Terms</h2>
        <div className={gridClasses}>
          <TextField
            id="expected_delivery_date"
            label="Expected Delivery Date"
            type="date"
            value={draft.expected_delivery_date}
            onChange={(e) => setField("expected_delivery_date", e.target.value)}
            error={fieldErrors.expected_delivery_date}
            disabled={status === "submitting"}
          />
          <TextField
            id="delivery_location"
            label="Delivery Location"
            placeholder="Optional"
            value={draft.delivery_location}
            onChange={(e) => setField("delivery_location", e.target.value)}
            error={fieldErrors.delivery_location}
            disabled={status === "submitting"}
          />
        </div>
        <TextArea
          id="payment_terms"
          label="Payment Terms"
          placeholder="e.g. 50% advance, 50% on delivery"
          value={draft.payment_terms}
          onChange={(e) => setField("payment_terms", e.target.value)}
          error={fieldErrors.payment_terms}
          disabled={status === "submitting"}
          rows={2}
        />
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
        Line items are added on the purchase order&apos;s own page after it&apos;s created — the same two-step flow
        the real API requires (create the header, then add items to it).
      </p>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={status === "submitting"}>
          Cancel
        </Button>
        <Button type="submit" isLoading={status === "submitting"}>
          {status === "submitting" ? "Creating…" : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
