/**
 * DEVELOPMENT-ONLY in-memory data layer for Vendor Payments. Same
 * reasoning and isolation as the other dev-preview fixture files: lives
 * outside apps/web/src/lib/sites/**, nothing here is imported unless
 * DEV_FIXTURE_MODE is active, and every function mirrors the async
 * signature of its real counterpart in
 * apps/web/src/lib/sites/vendor-payments-api.ts. No apiFetch/network call
 * is ever made from here. State resets on a full page reload.
 */

import { ApiError } from "@/lib/api-client";
import type {
  VndPaymentStatus,
  VndVendorPayment,
  VndVendorPaymentAllocation,
  VndVendorPaymentAllocationCreateInput,
  VndVendorPaymentCreateInput,
  VndVendorPaymentDetail,
  VndVendorPaymentListMeta,
} from "@/types/sites/vendor-payment";
import { PREVIEW_VENDOR_ID } from "./vendor-fixtures";
import { PREVIEW_INVOICE_ID, getInvoiceForPaymentValidation, recordInvoicePayment } from "./vendor-invoice-fixtures";

function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

const APEX_VENDOR_ID = "dev-vendor-apex";
const JSW_PROJECT_ID = "dev-project-jsw";
const SUZLON_PROJECT_ID = "dev-project-suzlon";

export const PREVIEW_PAYMENT_ID = "dev-payment-1";

let paymentStore: VndVendorPaymentDetail[] = [
  {
    vendor_payment_id: PREVIEW_PAYMENT_ID,
    payment_reference_number: "PAY-2026-0011",
    vendor_id: PREVIEW_VENDOR_ID,
    project_id: JSW_PROJECT_ID,
    bank_account_id: "dev-vbank-1",
    payment_date: "2026-02-25",
    amount: "200000.00",
    payment_method: "Bank Transfer",
    payment_status: "Processed",
    transaction_reference: "UTR2026022512345",
    remarks: "Development fixture — not a real payment. Partial payment against first cement delivery invoice.",
    approved_by: "dev-user",
    created_at: "2026-02-25T10:00:00.000Z",
  },
  {
    vendor_payment_id: "dev-payment-2",
    payment_reference_number: "PAY-2026-0015",
    vendor_id: APEX_VENDOR_ID,
    project_id: SUZLON_PROJECT_ID,
    bank_account_id: null,
    payment_date: "2026-03-01",
    amount: "10030.00",
    payment_method: "UPI",
    payment_status: "Pending",
    transaction_reference: null,
    remarks: null,
    approved_by: null,
    created_at: "2026-03-01T09:00:00.000Z",
  },
];

const allocationsStore: Record<string, VndVendorPaymentAllocation[]> = {
  [PREVIEW_PAYMENT_ID]: [
    {
      allocation_id: "dev-payalloc-1",
      vendor_payment_id: PREVIEW_PAYMENT_ID,
      vendor_invoice_id: PREVIEW_INVOICE_ID,
      allocated_amount: "200000.00",
      allocated_date: "2026-02-25",
    },
  ],
  "dev-payment-2": [],
};
// Seed-time cross-link, matching the real backend's syncExpensePaymentStatus
// side effect (doc: vndVendorPaymentAllocation.service.js) — keeps the
// invoice fixture's amount_paid/balance_amount consistent with this seeded
// allocation from the moment either module is first imported.
recordInvoicePayment(PREVIEW_INVOICE_ID, 200000);

let nextPaymentSeq = paymentStore.length + 1;
let nextAllocationSeq = 2;

const PAYMENT_STATUS_TRANSITIONS: Record<VndPaymentStatus, VndPaymentStatus[]> = {
  Pending: ["Processed", "Failed"],
  Processed: ["Reversed"],
  Failed: ["Pending"],
  Reversed: [],
};

function getPaymentOrThrow(paymentId: string): VndVendorPaymentDetail {
  const payment = paymentStore.find((p) => p.vendor_payment_id === paymentId);
  if (!payment) throw new ApiError(404, "Vendor payment not found in the development fixture store.");
  return payment;
}

function updatePaymentInStore(paymentId: string, patch: Partial<VndVendorPaymentDetail>): VndVendorPaymentDetail {
  let next: VndVendorPaymentDetail | undefined;
  paymentStore = paymentStore.map((p) => {
    if (p.vendor_payment_id !== paymentId) return p;
    next = { ...p, ...patch };
    return next;
  });
  if (!next) throw new ApiError(404, "Vendor payment not found in the development fixture store.");
  return next;
}

function allocatedTotal(paymentId: string): number {
  return (allocationsStore[paymentId] ?? []).reduce((sum, a) => sum + Number(a.allocated_amount), 0);
}

function allocatedTotalForInvoice(invoiceId: string): number {
  return Object.values(allocationsStore)
    .flat()
    .filter((a) => a.vendor_invoice_id === invoiceId)
    .reduce((sum, a) => sum + Number(a.allocated_amount), 0);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/vendor-payments-api.ts
// ---------------------------------------------------------------------------

export async function devGetVendorPaymentList(): Promise<{ payments: VndVendorPayment[]; meta: VndVendorPaymentListMeta }> {
  return resolved({
    payments: paymentStore,
    meta: { page: 1, limit: paymentStore.length, total: paymentStore.length, totalPages: 1 },
  });
}

export async function devGetVendorPaymentById(paymentId: string): Promise<VndVendorPaymentDetail> {
  return resolved(getPaymentOrThrow(paymentId));
}

export async function devCreateVendorPayment(input: VndVendorPaymentCreateInput): Promise<VndVendorPaymentDetail> {
  const vendor_payment_id = `dev-payment-${nextPaymentSeq++}`;
  const created: VndVendorPaymentDetail = {
    vendor_payment_id,
    payment_reference_number: input.payment_reference_number,
    vendor_id: input.vendor_id,
    project_id: input.project_id ?? null,
    bank_account_id: input.bank_account_id ?? null,
    payment_date: input.payment_date,
    amount: input.amount.toFixed(2),
    payment_method: input.payment_method,
    payment_status: "Pending",
    transaction_reference: input.transaction_reference ?? null,
    remarks: input.remarks ?? null,
    approved_by: null,
    created_at: new Date().toISOString(),
  };
  paymentStore = [created, ...paymentStore];
  allocationsStore[vendor_payment_id] = [];
  return resolved(created);
}

/** Mirrors src/services/vndVendorPayment.service.js#approve — can only be called once. */
export async function devApproveVendorPayment(paymentId: string): Promise<VndVendorPaymentDetail> {
  const payment = getPaymentOrThrow(paymentId);
  if (payment.approved_by) {
    throw new ApiError(409, JSON.stringify({ message: "This payment has already been approved" }));
  }
  return resolved(updatePaymentInStore(paymentId, { approved_by: "dev-user" }));
}

/** Mirrors src/services/vndVendorPayment.service.js#decideStatus — 'Processed' requires approved_by already set. */
export async function devUpdateVendorPaymentStatus(paymentId: string, status: VndPaymentStatus): Promise<VndVendorPaymentDetail> {
  const payment = getPaymentOrThrow(paymentId);
  if (!PAYMENT_STATUS_TRANSITIONS[payment.payment_status].includes(status)) {
    throw new ApiError(400, JSON.stringify({ message: `Invalid payment status transition: '${payment.payment_status}' -> '${status}'` }));
  }
  if (status === "Processed" && !payment.approved_by) {
    throw new ApiError(409, JSON.stringify({ message: "Payment must be approved before it can be marked Processed" }));
  }
  return resolved(updatePaymentInStore(paymentId, { payment_status: status }));
}

// ---------------------------------------------------------------------------
// Functions mirroring the nested allocations endpoints
// ---------------------------------------------------------------------------

export async function devGetVendorPaymentAllocations(paymentId: string): Promise<VndVendorPaymentAllocation[]> {
  return resolved(allocationsStore[paymentId] ?? []);
}

/**
 * Mirrors src/services/vndVendorPaymentAllocation.service.js#create exactly:
 * vendor match between payment and invoice, allocation doesn't exceed the
 * payment's remaining amount, doesn't exceed the invoice's remaining
 * balance — then records the allocation against the invoice fixture too
 * (recordInvoicePayment), same as the real syncExpensePaymentStatus side
 * effect.
 */
export async function devCreateVendorPaymentAllocation(
  paymentId: string,
  input: VndVendorPaymentAllocationCreateInput,
): Promise<VndVendorPaymentAllocation> {
  const payment = getPaymentOrThrow(paymentId);
  const invoice = getInvoiceForPaymentValidation(input.vendor_invoice_id);
  if (!invoice) throw new ApiError(400, JSON.stringify({ message: "vendor_invoice_id does not exist" }));
  if (invoice.vendor_id !== payment.vendor_id) {
    throw new ApiError(400, JSON.stringify({ message: "vendor_payment_id and vendor_invoice_id must belong to the same vendor" }));
  }

  const paymentAllocated = allocatedTotal(paymentId);
  if (paymentAllocated + input.allocated_amount > Number(payment.amount)) {
    throw new ApiError(409, JSON.stringify({ message: "Allocated amount would exceed this payment's total amount" }));
  }
  const invoiceAllocated = allocatedTotalForInvoice(input.vendor_invoice_id);
  if (invoiceAllocated + input.allocated_amount > invoice.total_amount) {
    throw new ApiError(409, JSON.stringify({ message: "Allocated amount would exceed this vendor invoice's total amount" }));
  }

  const created: VndVendorPaymentAllocation = {
    allocation_id: `dev-payalloc-${nextAllocationSeq++}`,
    vendor_payment_id: paymentId,
    vendor_invoice_id: input.vendor_invoice_id,
    allocated_amount: input.allocated_amount.toFixed(2),
    allocated_date: input.allocated_date,
  };
  allocationsStore[paymentId] = [...(allocationsStore[paymentId] ?? []), created];
  recordInvoicePayment(input.vendor_invoice_id, input.allocated_amount);
  return resolved(created);
}
