import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { getRfqList } from "@/lib/fixtures/rfq";
import { getCurrentQuotation, getQuotationItems } from "@/lib/fixtures/quotation";
import { getNegotiationOffersByQuotation } from "@/lib/fixtures/negotiation";

export const metadata: Metadata = {
  title: "Negotiations · SAV ERP",
  description: "Offer and counter-offer activity across the Commercial Lifecycle.",
};

export default async function NegotiationsOverviewPage() {
  const rfqs = await getRfqList();
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const quotation = await getCurrentQuotation(rfq.id);
        if (!quotation) return null;
        const [offers, items] = await Promise.all([
          getNegotiationOffersByQuotation(quotation.id),
          getQuotationItems(quotation.id),
        ]);
        if (offers.length === 0) return null;
        const settledCount = items.filter((item) => offers.some((o) => o.quotationItemId === item.id && o.isFinal)).length;
        const openCount = items.length - settledCount;
        return { rfq, offerCount: offers.length, settledCount, openCount };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  const totalOpen = rows.reduce((sum, r) => sum + r.openCount, 0);
  const totalSettled = rows.reduce((sum, r) => sum + r.settledCount, 0);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Negotiations"
        description="Offer and counter-offer activity per RFQ. Open an RFQ to see the full item-level timeline."
      />

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState icon={<UsersIcon className="h-8 w-8" />} title="No negotiation activity yet" description="Negotiation history will appear here once offers are recorded against a quotation." />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="RFQs in Negotiation" value={rows.length} variant="neutral" />
            <MetricCard label="Items Settled" value={totalSettled} variant="operational" />
            <MetricCard label="Items Open" value={totalOpen} variant="analytics" />
          </div>

          <Panel className="bg-surface overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">RFQ</th>
                  <th className="px-5 py-3 font-medium">Client / Project</th>
                  <th className="px-5 py-3 text-right font-medium">Total Offers</th>
                  <th className="px-5 py-3 text-right font-medium">Items Settled</th>
                  <th className="px-5 py-3 text-right font-medium">Items Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ rfq, offerCount, settledCount, openCount }) => (
                  <tr key={rfq.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/commercial/rfq/${rfq.id}/negotiation`} className="text-secondary hover:underline">
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-text-primary">{rfq.clientName}</div>
                      <div className="text-text-secondary">{rfq.projectName}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-text-secondary">{offerCount}</td>
                    <td className="px-5 py-3 text-right text-success">{settledCount}</td>
                    <td className="px-5 py-3 text-right text-warning">{openCount}</td>
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
