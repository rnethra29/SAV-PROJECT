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
import { createVendorInvoice } from "@/lib/sites/vendor-invoices-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendorInvoice } from "@/lib/dev-preview/vendor-invoice-fixtures";
import type { VndVendorInvoiceCreateInput } from "@/types/sites/vendor-invoice";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";
import type { VndPurchaseOrder } from "@/types/sites/procurement-order";

type VendorInvoiceCreateFormProps = {
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
  purchaseOrders: VndPurchaseOrder[];
};

type Draft = {
  invoice_number: string;
  vendor_id: string;
  project_id: string;
  purchase_order_id: string;
  invoice_date: string;
  due_date: string;
  subtotal_amount: string;
  tax_amount: string;
  remarks: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

function emptyDraft(): Draft {
  return {
    invoice_number: "",
    vendor_id: "",
    project_id: "",
    purchase_order_id: "",
    invoice_date: "",
    due_date: "",
    subtotal_amount: "",
    tax_amount: "0",
    remarks: "",
  };
}

/** Client-side pre-check per src/validators/vndVendorInvoice.validator.js#createVendorInvoice. */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.invoice_number.trim()) errors.invoice_number = "Enter the vendor's invoice number.";
  if (!draft.vendor_id) errors.vendor_id = "Select a vendor.";
  if (!draft.project_id) errors.project_id = "Select a project.";
  if (!draft.invoice_date) errors.invoice_date = "Enter the invoice date.";
  if (!draft.subtotal_amount.trim() || Number(draft.subtotal_amount) < 0) {
    errors.subtotal_amount = "Enter a valid subtotal amount.";
  }
  if (draft.tax_amount.trim() && Number(draft.tax_amount) < 0) errors.tax_amount = "Tax amount cannot be negative.";
  return errors;
}

function toCreateInput(draft: Draft): VndVendorInvoiceCreateInput {
  const input: VndVendorInvoiceCreateInput = {
    invoice_number: draft.invoice_number.trim(),
    vendor_id: draft.vendor_id,
    project_id: draft.project_id,
    invoice_date: draft.invoice_date,
    subtotal_amount: Number(draft.subtotal_amount),
    tax_amount: draft.tax_amount.trim() ? Number(draft.tax_amount) : 0,
  };
  if (draft.purchase_order_id) input.purchase_order_id = draft.purchase_order_id;
  if (draft.due_date) input.due_date = draft.due_date;
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

export function VendorInvoiceCreateForm({ vendors, projects, purchaseOrders }: VendorInvoiceCreateFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const vendorOptions = vendors.map((v) => ({ value: v.vendor_id, label: `${v.vendor_code} — ${v.vendor_name}` }));
  const projectOptions = projects.map((p) => ({ value: p.project_id, label: `${p.project_code} — ${p.project_name}` }));
  // Optional link (doc §6.13: "an invoice may not reference a PO — e.g. a
  // service call-out") — every PO is offered regardless of vendor, matching
  // the real backend's own create validation (it only checks the PO
  // exists, not that it belongs to the selected vendor).
  const poOptions = purchaseOrders.map((po) => ({ value: po.po_id, label: po.po_number }));

  const subtotal = Number(draft.subtotal_amount) || 0;
  const tax = Number(draft.tax_amount) || 0;

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
      // store — never a real POST /vendor-invoices call, never persisted.
      const created = DEV_FIXTURE_MODE
        ? await devCreateVendorInvoice(toCreateInput(draft))
        : await createVendorInvoice(toCreateInput(draft));
      router.replace(`/sites/vendor-invoices/${created.vendor_invoice_id}`);
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
          setFormError("Some fields need attention before this invoice can be saved.");
        } else if (error.status === 401) {
          router.replace("/login");
          return;
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to create vendor invoices. Contact an administrator.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while creating the invoice. Try again, and contact support if the problem continues.");
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
        <h2 className={sectionHeadingClasses}>Invoice Identity</h2>
        <div className={gridClasses}>
          <TextField
            id="invoice_number"
            label="Vendor's Invoice Number"
            placeholder="Vendor's own numbering"
            value={draft.invoice_number}
            onChange={(e) => setField("invoice_number", e.target.value)}
            error={fieldErrors.invoice_number}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="invoice_date"
            label="Invoice Date"
            type="date"
            value={draft.invoice_date}
            onChange={(e) => setField("invoice_date", e.target.value)}
            error={fieldErrors.invoice_date}
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
            placeholder="Select a project"
            options={projectOptions}
            value={draft.project_id}
            onChange={(e) => setField("project_id", e.target.value)}
            error={fieldErrors.project_id}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="purchase_order_id"
            label="Purchase Order"
            placeholder="Not linked to a PO (optional)"
            options={poOptions}
            value={draft.purchase_order_id}
            onChange={(e) => setField("purchase_order_id", e.target.value)}
            error={fieldErrors.purchase_order_id}
            disabled={status === "submitting"}
          />
          <TextField
            id="due_date"
            label="Due Date"
            type="date"
            value={draft.due_date}
            onChange={(e) => setField("due_date", e.target.value)}
            error={fieldErrors.due_date}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Amounts</h2>
        <div className={gridClasses}>
          <TextField
            id="subtotal_amount"
            label="Subtotal Amount"
            type="number"
            min={0}
            value={draft.subtotal_amount}
            onChange={(e) => setField("subtotal_amount", e.target.value)}
            error={fieldErrors.subtotal_amount}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="tax_amount"
            label="Tax Amount"
            type="number"
            min={0}
            value={draft.tax_amount}
            onChange={(e) => setField("tax_amount", e.target.value)}
            error={fieldErrors.tax_amount}
            disabled={status === "submitting"}
          />
        </div>
        <p className="text-xs text-text-secondary">
          Total (subtotal + tax): <span className="font-medium text-text-primary">₹{(subtotal + tax).toLocaleString("en-IN")}</span>
        </p>
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
        Reconciliation lines against PO items are added on the invoice&apos;s own page after it&apos;s created.
      </p>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={status === "submitting"}>
          Cancel
        </Button>
        <Button type="submit" isLoading={status === "submitting"}>
          {status === "submitting" ? "Creating…" : "Create Vendor Invoice"}
        </Button>
      </div>
    </form>
  );
}
