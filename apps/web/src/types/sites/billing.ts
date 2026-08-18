/**
 * Client Management (Sites module) — Client 360 Billing, sourced entirely
 * from GET /clients/:clientId/360 (src/routes/clmClient.routes.js:42,
 * src/services/clmClient360.service.js#getOverview). Every figure here is
 * read straight off a derived Postgres view (src/database/migrations/
 * 019_clm_views.sql) — nothing is computed client-side (doc §12: "everything
 * in this table is a view, never a stored/duplicated column").
 *
 * Numeric columns come back as strings (node-postgres's default for
 * NUMERIC, to avoid float precision loss), same convention as
 * ClmClientDetail.credit_limit_amount in types/sites/client.ts.
 */

export type ClmInvoiceStatus = "Draft" | "Submitted" | "Approved" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";

export type ClmVerificationStatus = "Pending" | "Verified" | "Rejected";

/** v_client_billing_summary row — one per invoice, paid/balance pre-computed via clm_payment_allocation. */
export type ClmClientBillingSummaryRow = {
  invoice_id: string;
  invoice_number: string;
  client_id: string;
  net_amount: string;
  paid_amount: string;
  balance_amount: string;
  status: ClmInvoiceStatus;
};

/** v_client_payment_summary row — one per payment, allocated/unallocated pre-computed via clm_payment_allocation. */
export type ClmClientPaymentSummaryRow = {
  client_id: string;
  payment_id: string;
  payment_reference_number: string;
  amount: string;
  payment_date: string;
  verification_status: ClmVerificationStatus;
  allocated_total: string;
  unallocated_amount: string;
};

/**
 * v_client_outstanding row — single total across all of the client's
 * invoices. The repository falls back to `{ client_id, total_outstanding: 0
 * }` (a JS number, not a SQL string) when the client has no invoices yet
 * (src/repositories/clmClient360.repository.js#outstanding), so this field
 * is typed to accept either shape.
 */
export type ClmClientOutstanding = {
  client_id: string;
  total_outstanding: string | number;
};

/**
 * v_client_financial_summary row — client-level PO/billed/received/
 * outstanding totals. total_po_value is joined through com_boq/com_po,
 * which currently target the external `clients` table rather than
 * clm_client (doc escalation #3, migration 019 header note) — so that
 * figure reads as 0 until that reconciliation lands. total_billed/
 * total_received/outstanding join directly off clm_client_invoice /
 * clm_payment_allocation by clm_client.client_id and are unaffected.
 */
export type ClmClientFinancialSummary = {
  client_id: string;
  total_po_value: string;
  total_billed: string;
  total_received: string;
  outstanding: string;
};

export type ClmClientBillingOverview = {
  billing_summary: ClmClientBillingSummaryRow[];
  payment_summary: ClmClientPaymentSummaryRow[];
  outstanding: ClmClientOutstanding;
  financial_summary: ClmClientFinancialSummary | null;
};
