import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { BarRow } from "@/components/commercial/shared/BarRow";
import { getRfqList, getRfqItems, isHeaderRfqItem } from "@/lib/fixtures/rfq";
import { getMarketPriceReferencesForRfq } from "@/lib/fixtures/market-price";

export const metadata: Metadata = {
  title: "Market Price Analysis · SAV ERP",
  description: "Multi-source reference pricing per RFQ item across the Commercial Lifecycle.",
};

export default async function MarketPriceOverviewPage() {
  const rfqs = await getRfqList();
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const items = (await getRfqItems(rfq.id)).filter((item) => !isHeaderRfqItem(item));
        const references = await getMarketPriceReferencesForRfq(items.map((item) => item.id));
        if (references.length === 0) return null;
        const pricedItemCount = new Set(references.map((r) => r.rfqItemId)).size;
        return { rfq, referenceCount: references.length, pricedItemCount, itemCount: items.length };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  const totalItemsPriced = rows.reduce((sum, r) => sum + r.pricedItemCount, 0);
  const totalReferences = rows.reduce((sum, r) => sum + r.referenceCount, 0);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Market Price Analysis"
        description="Reference prices gathered per RFQ item — current market, internal purchase and historical project rates."
      />

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState
            icon={<SearchIcon className="h-8 w-8" />}
            title="No market price references yet"
            description="Reference prices will appear here once gathered against RFQ items."
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="RFQs with Pricing" value={rows.length} variant="neutral" />
            <MetricCard label="Items Priced" value={totalItemsPriced} variant="operational" />
            <MetricCard label="Reference Records" value={totalReferences} variant="analytics" />
          </div>

          <Panel className="bg-surface p-5">
            <h2 className="text-sm font-semibold text-text-primary">Reference Coverage by RFQ</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Share of line items with at least one market price reference.</p>
            <div className="mt-5 space-y-3">
              {rows.map(({ rfq, pricedItemCount, itemCount }) => (
                <Link key={rfq.id} href={`/commercial/rfq/${rfq.id}/market-price`} className="block">
                  <BarRow
                    label={rfq.rfqNumber}
                    value={itemCount > 0 ? (pricedItemCount / itemCount) * 100 : 0}
                    max={100}
                    valueLabel={`${pricedItemCount} / ${itemCount} items`}
                    color="var(--secondary)"
                    labelClassName="w-32 shrink-0 truncate text-xs text-secondary hover:underline"
                  />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel className="bg-surface overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">RFQ</th>
                  <th className="px-5 py-3 font-medium">Client / Project</th>
                  <th className="px-5 py-3 text-right font-medium">Items Priced</th>
                  <th className="px-5 py-3 text-right font-medium">Reference Records</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ rfq, referenceCount, pricedItemCount, itemCount }) => (
                  <tr key={rfq.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/commercial/rfq/${rfq.id}/market-price`} className="text-secondary hover:underline">
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-text-primary">{rfq.clientName}</div>
                      <div className="text-text-secondary">{rfq.projectName}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-text-secondary">
                      {pricedItemCount} / {itemCount}
                    </td>
                    <td className="px-5 py-3 text-right text-text-secondary">{referenceCount}</td>
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
