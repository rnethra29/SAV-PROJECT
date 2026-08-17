import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/modules/commercial-lifecycle/components/shared/PageHeader";
import { ProportionBar } from "@/modules/commercial-lifecycle/components/shared/ProportionBar";
import { getRfqList } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getCurrentQuotation } from "@/modules/commercial-lifecycle/fixtures/quotation";
import { QuotationStatusBadge, QUOTATION_LABELS, QUOTATION_TONE } from "@/modules/commercial-lifecycle/components/shared/StatusBadges";
import { STATUS_TONE_COLOR } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { QuotationStatus } from "@/modules/commercial-lifecycle/types/quotation";

export const metadata: Metadata = {
  title: "Quotations · SAV ERP",
  description: "Versioned quotations issued to clients across the Commercial Lifecycle.",
};

export default async function QuotationsOverviewPage() {
  const rfqs = await getRfqList();
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const quotation = await getCurrentQuotation(rfq.id);
        if (!quotation) return null;
        return { rfq, quotation };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  const totalValue = rows.reduce((sum, r) => sum + (r.quotation.totalAmount ?? 0), 0);
  const statusCounts = rows.reduce(
    (counts, { quotation }) => {
      counts[quotation.status] = (counts[quotation.status] ?? 0) + 1;
      return counts;
    },
    {} as Partial<Record<QuotationStatus, number>>,
  );
  const statusSegments = (Object.keys(QUOTATION_LABELS) as QuotationStatus[])
    .filter((status) => (statusCounts[status] ?? 0) > 0)
    .map((status) => ({
      key: status,
      label: QUOTATION_LABELS[status],
      value: statusCounts[status] ?? 0,
      color: STATUS_TONE_COLOR[QUOTATION_TONE[status]],
    }));

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Quotations"
        description="Current version of each RFQ's quotation. Open an RFQ to review all versions and compare rates."
      />

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState icon={<InboxIcon className="h-8 w-8" />} title="No quotations yet" description="Quotations will appear here once drafted against an RFQ." />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard label="Active Quotations" value={rows.length} variant="neutral" />
            <MetricCard label="Total Quoted Value" value={totalValue} variant="analytics" valueFormatter={formatCurrency} />
          </div>

          <Panel className="bg-surface p-5">
            <h2 className="text-sm font-semibold text-text-primary">Quotations by Status</h2>
            <div className="mt-4">
              <ProportionBar segments={statusSegments} />
            </div>
          </Panel>

          <Panel className="bg-surface overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Quotation Number</th>
                  <th className="px-5 py-3 font-medium">RFQ</th>
                  <th className="px-5 py-3 font-medium">Client / Project</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ rfq, quotation }) => (
                  <tr key={quotation.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3 font-medium text-text-primary">
                      {quotation.quotationNumber} <span className="text-text-secondary">v{quotation.versionNo}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/commercial/rfq/${rfq.id}/quotation`} className="text-secondary hover:underline">
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-text-primary">{rfq.clientName}</div>
                      <div className="text-text-secondary">{rfq.projectName}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(quotation.quotationDate)}</td>
                    <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(quotation.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <QuotationStatusBadge status={quotation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}
    </div>
  );
}
