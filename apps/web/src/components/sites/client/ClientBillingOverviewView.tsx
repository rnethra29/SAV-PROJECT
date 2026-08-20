import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartBarIcon, InboxIcon } from "@/components/ui/icons";
import { InvoiceStatusBadge, VerificationStatusBadge } from "./BillingBadges";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ClmClientBillingOverview } from "@/types/sites/billing";

type ClientBillingOverviewViewProps = {
  overview: ClmClientBillingOverview;
};

function toAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Pure rendering for the Billing section, extracted out of
 * ClientBillingContainer so it can be reused wherever a loaded billing
 * overview is already available (e.g. a development preview) — same
 * List/Detail split already used for ClientListContainer/ClientListView.
 */
export function ClientBillingOverviewView({ overview }: ClientBillingOverviewViewProps) {
  const { billing_summary, payment_summary, outstanding, financial_summary } = overview;

  // total_po_value is deliberately not surfaced: it's joined through
  // com_boq/com_po, which currently target the external `clients` table
  // rather than clm_client (pending the Module 04 reconciliation noted in
  // 019_clm_views.sql), so it always reads 0 regardless of real PO activity
  // — showing it here would misrepresent a known data gap as "no POs".
  const totalBilled = toAmount(financial_summary?.total_billed);
  const totalReceived = toAmount(financial_summary?.total_received);
  const totalOutstanding = toAmount(outstanding.total_outstanding);

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Billing</h3>
        </div>
        <dl className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Billed</dt>
            <dd className="mt-0.5 text-base font-semibold text-text-primary">{formatCurrency(totalBilled)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Received</dt>
            <dd className="mt-0.5 text-base font-semibold text-text-primary">{formatCurrency(totalReceived)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Outstanding</dt>
            <dd className="mt-0.5 text-base font-semibold text-text-primary">{formatCurrency(totalOutstanding)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel className="bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Invoices</h3>
        </div>
        {billing_summary.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-8 w-8" />}
            title="No invoices yet"
            description="Invoices for this client will appear here once billing begins."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium">Outstanding</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing_summary.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border-b border-border last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3 font-medium text-text-primary">{invoice.invoice_number}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {formatCurrency(toAmount(invoice.net_amount))}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {formatCurrency(toAmount(invoice.paid_amount))}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {formatCurrency(toAmount(invoice.balance_amount))}
                    </td>
                    <td className="px-5 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Payments</h3>
        </div>
        {payment_summary.length === 0 ? (
          <EmptyState
            icon={<ChartBarIcon className="h-8 w-8" />}
            title="No payments yet"
            description="Payments received from this client will appear here once recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Allocated</th>
                  <th className="px-5 py-3 font-medium">Unallocated</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payment_summary.map((payment) => (
                  <tr key={payment.payment_id} className="border-b border-border last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3 font-medium text-text-primary">{payment.payment_reference_number}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(payment.payment_date)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {formatCurrency(toAmount(payment.amount))}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {formatCurrency(toAmount(payment.allocated_total))}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {formatCurrency(toAmount(payment.unallocated_amount))}
                    </td>
                    <td className="px-5 py-3">
                      <VerificationStatusBadge status={payment.verification_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
