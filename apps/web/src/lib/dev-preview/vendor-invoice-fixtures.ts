/**
 * DEVELOPMENT-ONLY in-memory data layer for Vendor Invoices. Same
 * reasoning and isolation as the other dev-preview fixture files: lives
 * outside apps/web/src/lib/sites/**, nothing here is imported unless
 * DEV_FIXTURE_MODE is active, and every function mirrors the async
 * signature of its real counterpart in
 * apps/web/src/lib/sites/vendor-invoices-api.ts. No apiFetch/network call
 * is ever made from here. State resets on a full page reload.
 */

import { ApiError } from "@/lib/api-client";
import type {
  VndInvoiceStatus,
  VndVendorInvoice,
  VndVendorInvoiceCreateInput,
  VndVendorInvoiceDetail,
  VndVendorInvoiceItem,
  VndVendorInvoiceItemCreateInput,
  VndVendorInvoiceListMeta,
  VndVendorInvoiceSummary,
} from "@/types/sites/vendor-invoice";
import { PREVIEW_VENDOR_ID } from "./vendor-fixtures";
import { PREVIEW_PO_ID } from "./procurement-fixtures";

function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

const APEX_VENDOR_ID = "dev-vendor-apex";
const SUZLON_PROJECT_ID = "dev-project-suzlon";
const JSW_PROJECT_ID = "dev-project-jsw";

export const PREVIEW_INVOICE_ID = "dev-invoice-1";

let invoiceStore: VndVendorInvoiceDetail[] = [
  {
    vendor_invoice_id: PREVIEW_INVOICE_ID,
    invoice_number: "UTC-INV-2026-0091",
    vendor_id: PREVIEW_VENDOR_ID,
    purchase_order_id: PREVIEW_PO_ID,
    project_id: JSW_PROJECT_ID,
    invoice_date: "2026-02-19",
    due_date: "2026-03-19",
    subtotal_amount: "246000.00",
    tax_amount: "68880.00",
    total_amount: "314880.00",
    status: "Submitted",
    verified_by: null,
    verified_at: null,
    remarks: "Development fixture — not a real vendor invoice. Covers first cement delivery (600 of 1,000 bags).",
    created_at: "2026-02-19T10:00:00.000Z",
  },
  {
    vendor_invoice_id: "dev-invoice-2",
    invoice_number: "APEX-SV-2026-0014",
    vendor_id: APEX_VENDOR_ID,
    purchase_order_id: null,
    project_id: SUZLON_PROJECT_ID,
    invoice_date: "2026-02-22",
    due_date: null,
    subtotal_amount: "8500.00",
    tax_amount: "1530.00",
    total_amount: "10030.00",
    status: "Draft",
    verified_by: null,
    verified_at: null,
    remarks: "Site inspection call-out — no PO, per architecture doc §6.13 (an invoice may not reference a PO).",
    created_at: "2026-02-22T10:00:00.000Z",
  },
];

/**
 * Incrementally maintained by vendor-payment-fixtures.ts#devCreateVendorPaymentAllocation
 * — mirrors v_vendor_invoice_summary.amount_paid (doc §6.17), which the real
 * backend derives by summing vnd_vendor_payment_allocation rows. Kept as a
 * running total here (rather than this module importing the allocations
 * store back) specifically to avoid a circular import between the two
 * fixture files — payment-fixtures already imports from here for the
 * vendor-match/total-amount checks doc §6.16 requires.
 */
const paidAmounts: Record<string, number> = {};

/** Called only by vendor-payment-fixtures.ts when an allocation is created against this invoice. */
export function recordInvoicePayment(invoiceId: string, amount: number) {
  paidAmounts[invoiceId] = (paidAmounts[invoiceId] ?? 0) + amount;
}

/** Read-only lookup for vendor-payment-fixtures.ts's create-time validation (vendor match, remaining balance) — doc §6.16. */
export function getInvoiceForPaymentValidation(invoiceId: string): { vendor_id: string; total_amount: number } | null {
  const invoice = invoiceStore.find((i) => i.vendor_invoice_id === invoiceId);
  return invoice ? { vendor_id: invoice.vendor_id, total_amount: Number(invoice.total_amount) } : null;
}

const itemsStore: Record<string, VndVendorInvoiceItem[]> = {
  [PREVIEW_INVOICE_ID]: [
    {
      vendor_invoice_item_id: "dev-invitem-1",
      vendor_invoice_id: PREVIEW_INVOICE_ID,
      po_item_id: "dev-poitem-1",
      description: "OPC 53 Grade Cement — first delivery",
      quantity: "600.000",
      unit: "Bag",
      rate: "410.0000",
      line_amount: "246000.00",
      sequence_no: 1,
    },
  ],
  "dev-invoice-2": [],
};

let nextInvoiceSeq = invoiceStore.length + 1;
let nextInvoiceItemSeq = 2;

const INVOICE_STATUS_TRANSITIONS: Record<VndInvoiceStatus, VndInvoiceStatus[]> = {
  Draft: ["Submitted", "Cancelled"],
  Submitted: ["Verified", "Disputed", "Cancelled"],
  Verified: ["Approved", "Disputed", "Cancelled"],
  Approved: ["Partially Paid", "Paid", "Disputed", "Cancelled"],
  "Partially Paid": ["Paid", "Disputed", "Cancelled"],
  Disputed: ["Submitted", "Cancelled"],
  Paid: [],
  Cancelled: [],
};

function getInvoiceOrThrow(invoiceId: string): VndVendorInvoiceDetail {
  const invoice = invoiceStore.find((i) => i.vendor_invoice_id === invoiceId);
  if (!invoice) throw new ApiError(404, "Vendor invoice not found in the development fixture store.");
  return invoice;
}

function updateInvoiceInStore(invoiceId: string, patch: Partial<VndVendorInvoiceDetail>): VndVendorInvoiceDetail {
  let next: VndVendorInvoiceDetail | undefined;
  invoiceStore = invoiceStore.map((i) => {
    if (i.vendor_invoice_id !== invoiceId) return i;
    next = { ...i, ...patch };
    return next;
  });
  if (!next) throw new ApiError(404, "Vendor invoice not found in the development fixture store.");
  return next;
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/vendor-invoices-api.ts
// ---------------------------------------------------------------------------

export async function devGetVendorInvoiceList(): Promise<{ invoices: VndVendorInvoice[]; meta: VndVendorInvoiceListMeta }> {
  return resolved({
    invoices: invoiceStore,
    meta: { page: 1, limit: invoiceStore.length, total: invoiceStore.length, totalPages: 1 },
  });
}

export async function devGetVendorInvoiceById(invoiceId: string): Promise<VndVendorInvoiceDetail> {
  return resolved(getInvoiceOrThrow(invoiceId));
}

export async function devCreateVendorInvoice(input: VndVendorInvoiceCreateInput): Promise<VndVendorInvoiceDetail> {
  const vendor_invoice_id = `dev-invoice-${nextInvoiceSeq++}`;
  const subtotal = input.subtotal_amount;
  const tax = input.tax_amount;
  const created: VndVendorInvoiceDetail = {
    vendor_invoice_id,
    invoice_number: input.invoice_number,
    vendor_id: input.vendor_id,
    purchase_order_id: input.purchase_order_id ?? null,
    project_id: input.project_id,
    invoice_date: input.invoice_date,
    due_date: input.due_date ?? null,
    subtotal_amount: subtotal.toFixed(2),
    tax_amount: tax.toFixed(2),
    total_amount: (subtotal + tax).toFixed(2),
    status: "Draft",
    verified_by: null,
    verified_at: null,
    remarks: input.remarks ?? null,
    created_at: new Date().toISOString(),
  };
  invoiceStore = [created, ...invoiceStore];
  itemsStore[vendor_invoice_id] = [];
  return resolved(created);
}

/** Mirrors src/services/vndVendorInvoice.service.js#update's status-transition gate. */
export async function devUpdateVendorInvoiceStatus(invoiceId: string, status: VndInvoiceStatus): Promise<VndVendorInvoiceDetail> {
  const invoice = getInvoiceOrThrow(invoiceId);
  if (!INVOICE_STATUS_TRANSITIONS[invoice.status].includes(status)) {
    throw new ApiError(400, JSON.stringify({ message: `Invalid vendor invoice status transition: '${invoice.status}' -> '${status}'` }));
  }
  // Same simplification as devApproveProcurementOrderStage (procurement-fixtures.ts):
  // the real 'Approved' transition also requires a pre-existing Approved
  // com_approvals record (doc §13) — that engine has no frontend yet, so
  // this applies the resulting status without modeling the gate itself.
  return resolved(updateInvoiceInStore(invoiceId, { status }));
}

/** Single mandatory checkpoint before approval (doc §13) — sets verified_by/verified_at, mirroring the real dedicated endpoint. */
export async function devVerifyVendorInvoice(invoiceId: string): Promise<VndVendorInvoiceDetail> {
  const invoice = getInvoiceOrThrow(invoiceId);
  if (!INVOICE_STATUS_TRANSITIONS[invoice.status].includes("Verified")) {
    throw new ApiError(400, JSON.stringify({ message: `Invalid vendor invoice status transition: '${invoice.status}' -> 'Verified'` }));
  }
  return resolved(
    updateInvoiceInStore(invoiceId, { status: "Verified", verified_by: "dev-user", verified_at: new Date().toISOString() }),
  );
}

/**
 * v_vendor_invoice_summary (doc §6.17) — amount_paid/balance_amount are
 * always derived from vnd_vendor_payment_allocation. Reflects real
 * allocations recorded via Vendor Payments (recordInvoicePayment above),
 * not a hardcoded 0.
 */
export async function devGetVendorInvoiceSummary(invoiceId: string): Promise<VndVendorInvoiceSummary> {
  const invoice = getInvoiceOrThrow(invoiceId);
  const amountPaid = paidAmounts[invoiceId] ?? 0;
  const balance = Number(invoice.total_amount) - amountPaid;
  return resolved({
    vendor_invoice_id: invoice.vendor_invoice_id,
    vendor_id: invoice.vendor_id,
    total_amount: invoice.total_amount,
    amount_paid: amountPaid.toFixed(2),
    balance_amount: balance.toFixed(2),
    status: invoice.status,
  });
}

// ---------------------------------------------------------------------------
// Functions mirroring the nested items endpoints
// ---------------------------------------------------------------------------

export async function devGetVendorInvoiceItems(invoiceId: string): Promise<VndVendorInvoiceItem[]> {
  return resolved(itemsStore[invoiceId] ?? []);
}

export async function devCreateVendorInvoiceItem(
  invoiceId: string,
  input: VndVendorInvoiceItemCreateInput,
): Promise<VndVendorInvoiceItem> {
  const lineAmount = input.quantity * input.rate;
  const created: VndVendorInvoiceItem = {
    vendor_invoice_item_id: `dev-invitem-${nextInvoiceItemSeq++}`,
    vendor_invoice_id: invoiceId,
    po_item_id: input.po_item_id ?? null,
    description: input.description,
    quantity: input.quantity.toFixed(3),
    unit: input.unit ?? null,
    rate: input.rate.toFixed(4),
    line_amount: lineAmount.toFixed(2),
    sequence_no: input.sequence_no,
  };
  itemsStore[invoiceId] = [...(itemsStore[invoiceId] ?? []), created];
  return resolved(created);
}
