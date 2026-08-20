import { apiFetch } from "@/lib/api-client";
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

type VndInvoiceListResponse = {
  success: boolean;
  message: string;
  data: VndVendorInvoice[];
  meta: VndVendorInvoiceListMeta;
};

type VndInvoiceResponse = {
  success: boolean;
  message: string;
  data: VndVendorInvoiceDetail;
};

type VndInvoiceSummaryResponse = {
  success: boolean;
  message: string;
  data: VndVendorInvoiceSummary;
};

type VndInvoiceItemListResponse = {
  success: boolean;
  message: string;
  data: VndVendorInvoiceItem[];
};

type VndInvoiceItemResponse = {
  success: boolean;
  message: string;
  data: VndVendorInvoiceItem;
};

/**
 * GET /vendor-invoices — src/routes/vndVendorInvoice.routes.js, mounted at
 * src/routes/index.js:111.
 */
export async function getVendorInvoiceList(): Promise<{ invoices: VndVendorInvoice[]; meta: VndVendorInvoiceListMeta }> {
  const response = await apiFetch<VndInvoiceListResponse>("/vendor-invoices");
  return { invoices: response.data, meta: response.meta };
}

/** GET /vendor-invoices/:id — used by the invoice detail page. */
export async function getVendorInvoiceById(invoiceId: string): Promise<VndVendorInvoiceDetail> {
  const response = await apiFetch<VndInvoiceResponse>(`/vendor-invoices/${invoiceId}`);
  return response.data;
}

/**
 * POST /vendor-invoices — requires the Accountant role, validates against
 * createVendorInvoice. subtotal_amount/tax_amount are directly entered
 * (unlike PO items, invoice items don't trigger-roll-up the header total).
 */
export async function createVendorInvoice(input: VndVendorInvoiceCreateInput): Promise<VndVendorInvoiceDetail> {
  const response = await apiFetch<VndInvoiceResponse>("/vendor-invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * PATCH /vendor-invoices/:id — generic update, used here only for the
 * plain status moves with no dedicated action endpoint (Submitted,
 * Approved, Disputed, Cancelled, re-Submitted from Disputed). The
 * backend's VND_INVOICE_TRANSITIONS map is the real gate.
 */
export async function updateVendorInvoiceStatus(invoiceId: string, status: VndInvoiceStatus): Promise<VndVendorInvoiceDetail> {
  const response = await apiFetch<VndInvoiceResponse>(`/vendor-invoices/${invoiceId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.data;
}

/**
 * POST /vendor-invoices/:id/verify — the single mandatory checkpoint before
 * approval (doc §13's "required invoice verification" validation). Sets
 * verified_by/verified_at server-side.
 */
export async function verifyVendorInvoice(invoiceId: string): Promise<VndVendorInvoiceDetail> {
  const response = await apiFetch<VndInvoiceResponse>(`/vendor-invoices/${invoiceId}/verify`, { method: "POST" });
  return response.data;
}

/** GET /vendor-invoices/:id/summary — v_vendor_invoice_summary (doc §6.17: amount_paid/balance_amount, never stored). */
export async function getVendorInvoiceSummary(invoiceId: string): Promise<VndVendorInvoiceSummary> {
  const response = await apiFetch<VndInvoiceSummaryResponse>(`/vendor-invoices/${invoiceId}/summary`);
  return response.data;
}

/** GET /vendor-invoices/:invoiceId/items — nested reconciliation lines against PO items. */
export async function getVendorInvoiceItems(invoiceId: string): Promise<VndVendorInvoiceItem[]> {
  const response = await apiFetch<VndInvoiceItemListResponse>(`/vendor-invoices/${invoiceId}/items`);
  return response.data;
}

/** POST /vendor-invoices/:invoiceId/items — requires Accountant, validates against createInvoiceItemForInvoice. */
export async function createVendorInvoiceItem(
  invoiceId: string,
  input: VndVendorInvoiceItemCreateInput,
): Promise<VndVendorInvoiceItem> {
  const response = await apiFetch<VndInvoiceItemResponse>(`/vendor-invoices/${invoiceId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}
