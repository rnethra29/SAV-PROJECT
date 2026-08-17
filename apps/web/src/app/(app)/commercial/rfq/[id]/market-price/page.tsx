import type { Metadata } from "next";
import { getRfqItems, isHeaderRfqItem } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getEstimationItemByRfqItemId } from "@/modules/commercial-lifecycle/fixtures/estimation";
import { getMarketPriceReferences } from "@/modules/commercial-lifecycle/fixtures/market-price";
import { MarketPriceAnalysisPanel } from "@/modules/commercial-lifecycle/components/market-price/MarketPriceAnalysisPanel";

export const metadata: Metadata = { title: "Market Price Analysis · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqMarketPricePage({ params }: PageProps) {
  const { id } = await params;
  const rfqItems = (await getRfqItems(id)).filter((item) => !isHeaderRfqItem(item));

  const groups = await Promise.all(
    rfqItems.map(async (rfqItem) => {
      const [estimationItem, references] = await Promise.all([
        getEstimationItemByRfqItemId(rfqItem.id),
        getMarketPriceReferences(rfqItem.id),
      ]);
      return {
        rfqItem,
        estimatedUnitCost: estimationItem?.estimatedUnitCost ?? null,
        references,
      };
    }),
  );

  return <MarketPriceAnalysisPanel groups={groups} />;
}
