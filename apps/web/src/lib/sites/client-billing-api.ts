import { apiFetch } from "@/lib/api-client";
import type {
  ClmClientBillingOverview,
  ClmClientBillingSummaryRow,
  ClmClientFinancialSummary,
  ClmClientOutstanding,
  ClmClientPaymentSummaryRow,
} from "@/types/sites/billing";

/**
 * Full shape of GET /clients/:clientId/360's `data` (clmClient360.service.js
 * #getOverview) — only the billing-relevant fields are modeled here; the
 * endpoint also returns overview/projects/rfq_history/boq_summary/
 * po_summary/cost_utilization/profit_analysis for other Client 360 sections
 * not built yet.
 */
type ClmClient360Data = {
  billing_summary: ClmClientBillingSummaryRow[];
  payment_summary: ClmClientPaymentSummaryRow[];
  outstanding: ClmClientOutstanding;
  financial_summary: ClmClientFinancialSummary | null;
};

type ClmClient360Response = {
  success: boolean;
  message: string;
  data: ClmClient360Data;
};

/**
 * GET /clients/:clientId/360 — src/routes/clmClient.routes.js:42, backed by
 * clmClient360.service.js#getOverview, which assembles the response
 * entirely from the derived views in src/database/migrations/
 * 019_clm_views.sql (doc §18). This is the Client 360 dashboard's own
 * bundled overview call — used here for its billing_summary/
 * payment_summary/outstanding/financial_summary slices only, since no
 * narrower "billing summary" endpoint exists on its own. Real backend call,
 * no fixture fallback: a client with no invoices/payments yet is a
 * legitimate, expected state — never masked with mock rows or invented
 * totals.
 */
export async function getClientBillingOverview(clientId: string): Promise<ClmClientBillingOverview> {
  const response = await apiFetch<ClmClient360Response>(`/clients/${clientId}/360`);
  const { billing_summary, payment_summary, outstanding, financial_summary } = response.data;
  return { billing_summary, payment_summary, outstanding, financial_summary };
}
