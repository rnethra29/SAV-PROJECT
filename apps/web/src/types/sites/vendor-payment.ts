/**
 * Vendor payment (vnd_vendor_payment/_allocation), per architecture doc
 * §6.15-6.16 and src/validators/vndVendorPayment.validator.js. Field names
 * mirror the raw GET /vendor-payments response (snake_case).
 */

export type VndPaymentMethod = "Bank Transfer" | "Cheque" | "UPI" | "Cash" | "Other";
export type VndPaymentStatus = "Pending" | "Processed" | "Failed" | "Reversed";

export type VndVendorPayment = {
  vendor_payment_id: string;
  payment_reference_number: string;
  vendor_id: string;
  project_id: string | null;
  payment_date: string;
  amount: string;
  payment_method: VndPaymentMethod;
  payment_status: VndPaymentStatus;
  created_at: string;
};

export type VndVendorPaymentListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Full vnd_vendor_payment row, per architecture doc §6.15. */
export type VndVendorPaymentDetail = VndVendorPayment & {
  bank_account_id: string | null;
  transaction_reference: string | null;
  remarks: string | null;
  // Required-approval-before-payment gate (doc §6.15/§20): a Finance
  // Manager stamps this via POST /:id/approve before payment_status can
  // move to 'Processed'.
  approved_by: string | null;
};

/** POST /vendor-payments body, per `createPayment` schema. Always created with payment_status='Pending', approved_by=null server-side. */
export type VndVendorPaymentCreateInput = {
  payment_reference_number: string;
  vendor_id: string;
  project_id?: string;
  bank_account_id?: string;
  payment_date: string;
  amount: number;
  payment_method: VndPaymentMethod;
  transaction_reference?: string;
  remarks?: string;
};

/** vnd_vendor_payment_allocation row, per architecture doc §6.16 — append-only, no update/delete. */
export type VndVendorPaymentAllocation = {
  allocation_id: string;
  vendor_payment_id: string;
  vendor_invoice_id: string;
  allocated_amount: string;
  allocated_date: string;
};

/** POST /vendor-payments/:paymentId/allocations body, per `createAllocationForPayment` schema. */
export type VndVendorPaymentAllocationCreateInput = {
  vendor_invoice_id: string;
  allocated_amount: number;
  allocated_date: string;
};
