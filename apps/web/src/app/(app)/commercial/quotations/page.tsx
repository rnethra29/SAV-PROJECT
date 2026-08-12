import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon } from "@/components/ui/icons";
import { getRfqList } from "@/lib/fixtures/rfq";
import { getCurrentQuotation } from "@/lib/fixtures/quotation";
import { QuotationStatusBadge } from "@/components/commercial/shared/StatusBadges";
import { formatCurrency, formatDate } from "@/lib/format";

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

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">Quotations</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Current version of each RFQ&apos;s quotation. Open an RFQ to review all versions and compare rates.
        </p>
      </div>

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState icon={<InboxIcon className="h-8 w-8" />} title="No quotations yet" description="Quotations will appear here once drafted against an RFQ." />
        </Panel>
      ) : (
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
                <tr key={quotation.id} className="border-b border-border last:border-0">
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
      )}
    </div>
  );
}
