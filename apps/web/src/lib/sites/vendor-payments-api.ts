import { apiFetch } from "@/lib/api-client";
import type {
  VndPaymentStatus,
  VndVendorPayment,
  VndVendorPaymentAllocation,
  VndVendorPaymentAllocationCreateInput,
  VndVendorPaymentCreateInput,
  VndVendorPaymentDetail,
  VndVendorPaymentListMeta,
} from "@/types/sites/vendor-payment";

type VndPaymentListResponse = {
  success: boolean;
  message: string;
  data: VndVendorPayment[];
  meta: VndVendorPaymentListMeta;
};

type VndPaymentResponse = {
  success: boolean;
  message: string;
  data: VndVendorPaymentDetail;
};

type VndAllocationListResponse = {
  success: boolean;
  message: string;
  data: VndVendorPaymentAllocation[];
};

type VndAllocationResponse = {
  success: boolean;
  message: string;
  data: VndVendorPaymentAllocation;
};

/** GET /vendor-payments — src/routes/vndVendorPayment.routes.js, mounted at src/routes/index.js:113. */
export async function getVendorPaymentList(): Promise<{ payments: VndVendorPayment[]; meta: VndVendorPaymentListMeta }> {
  const response = await apiFetch<VndPaymentListResponse>("/vendor-payments");
  return { payments: response.data, meta: response.meta };
}

/** GET /vendor-payments/:id — used by the payment detail page. */
export async function getVendorPaymentById(paymentId: string): Promise<VndVendorPaymentDetail> {
  const response = await apiFetch<VndPaymentResponse>(`/vendor-payments/${paymentId}`);
  return response.data;
}

/**
 * POST /vendor-payments — requires the Accountant role, validates against
 * createPayment. Always created as payment_status='Pending'.
 */
export async function createVendorPayment(input: VndVendorPaymentCreateInput): Promise<VndVendorPaymentDetail> {
  const response = await apiFetch<VndPaymentResponse>("/vendor-payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * POST /vendor-payments/:id/approve — requires Finance Manager, no body.
 * Stamps approved_by; the required-approval-before-payment gate (doc §6.15)
 * that /status checks before allowing 'Processed'. Can only be called once.
 */
export async function approveVendorPayment(paymentId: string): Promise<VndVendorPaymentDetail> {
  const response = await apiFetch<VndPaymentResponse>(`/vendor-payments/${paymentId}/approve`, { method: "POST" });
  return response.data;
}

/** POST /vendor-payments/:id/status {status} — VND_PAYMENT_TRANSITIONS gate (Pending<->Failed, Pending->Processed, Processed->Reversed). */
export async function updateVendorPaymentStatus(paymentId: string, status: VndPaymentStatus): Promise<VndVendorPaymentDetail> {
  const response = await apiFetch<VndPaymentResponse>(`/vendor-payments/${paymentId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  return response.data;
}

/** GET /vendor-payments/:paymentId/allocations — nested, append-only allocation history for this payment. */
export async function getVendorPaymentAllocations(paymentId: string): Promise<VndVendorPaymentAllocation[]> {
  const response = await apiFetch<VndAllocationListResponse>(`/vendor-payments/${paymentId}/allocations`);
  return response.data;
}

/**
 * POST /vendor-payments/:paymentId/allocations — requires Accountant,
 * validates against createAllocationForPayment. The backend enforces
 * (defense-in-depth, doc §6.16): payment and invoice belong to the same
 * vendor, allocation doesn't exceed the payment's remaining amount, and
 * doesn't exceed the invoice's remaining balance.
 */
export async function createVendorPaymentAllocation(
  paymentId: string,
  input: VndVendorPaymentAllocationCreateInput,
): Promise<VndVendorPaymentAllocation> {
  const response = await apiFetch<VndAllocationResponse>(`/vendor-payments/${paymentId}/allocations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}
