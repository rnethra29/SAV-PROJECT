import type { Metadata } from "next";
import { getRfqItems, isHeaderRfqItem } from "@/lib/fixtures/rfq";
import { getActualPrice } from "@/lib/fixtures/actual-price";
import { ActualPriceTable } from "@/components/commercial/actual-price/ActualPriceTable";

export const metadata: Metadata = { title: "Actual Price · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqActualPricePage({ params }: PageProps) {
  const { id } = await params;
  const rfqItems = (await getRfqItems(id)).filter((item) => !isHeaderRfqItem(item));

  const rows = await Promise.all(
    rfqItems.map(async (rfqItem) => ({
      rfqItem,
      actualPrice: await getActualPrice(rfqItem.id),
    })),
  );

  return <ActualPriceTable rows={rows} />;
}
