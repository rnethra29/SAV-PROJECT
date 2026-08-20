/**
 * Vendor invoice (vnd_vendor_invoice/_item), per architecture doc
 * §6.13-6.14 and src/validators/vndVendorInvoice.validator.js +
 * vndVendorInvoiceItem.validator.js. Field names mirror the raw
 * GET /vendor-invoices response (snake_case), same convention as
 * VndPurchaseOrder. Reconciled against Procurement Order items via the
 * nullable po_item_id link on each invoice line (doc §6.14) — not the same
 * thing as the invoice itself optionally citing a purchase_order_id.
 */

export type VndInvoiceStatus =
  | "Draft"
  | "Submitted"
  | "Verified"
  | "Approved"
  | "Partially Paid"
  | "Paid"
  | "Disputed"
  | "Cancelled";

export type VndVendorInvoice = {
  vendor_invoice_id: string;
  invoice_number: string;
  vendor_id: string;
  purchase_order_id: string | null;
  project_id: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: string;
  status: VndInvoiceStatus;
  created_at: string;
};

export type VndVendorInvoiceListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Full vnd_vendor_invoice row, per architecture doc §6.13. Unlike
 * vnd_purchase_order, subtotal_amount/tax_amount are plain, directly-entered
 * fields here (not trigger-rolled-up from item rows) — only total_amount is
 * a same-row GENERATED column (subtotal + tax).
 */
export type VndVendorInvoiceDetail = VndVendorInvoice & {
  subtotal_amount: string;
  tax_amount: string;
  verified_by: string | null;
  verified_at: string | null;
  remarks: string | null;
};

/** POST /vendor-invoices body, per `createVendorInvoice` schema. */
export type VndVendorInvoiceCreateInput = {
  invoice_number: string;
  vendor_id: string;
  purchase_order_id?: string;
  project_id: string;
  invoice_date: string;
  due_date?: string;
  subtotal_amount: number;
  tax_amount: number;
  remarks?: string;
};

/** vnd_vendor_invoice_item row, per architecture doc §6.14 — reconciliation line against a PO item. */
export type VndVendorInvoiceItem = {
  vendor_invoice_item_id: string;
  vendor_invoice_id: string;
  po_item_id: string | null;
  description: string;
  quantity: string;
  unit: string | null;
  rate: string;
  line_amount: string;
  sequence_no: number;
};

/** POST /vendor-invoices/:invoiceId/items body, per `createInvoiceItemForInvoice` schema. */
export type VndVendorInvoiceItemCreateInput = {
  po_item_id?: string;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  sequence_no: number;
};

/** GET /vendor-invoices/:id/summary — v_vendor_invoice_summary (doc §6.17), never stored. */
export type VndVendorInvoiceSummary = {
  vendor_invoice_id: string;
  vendor_id: string;
  total_amount: string;
  amount_paid: string;
  balance_amount: string;
  status: VndInvoiceStatus;
};
