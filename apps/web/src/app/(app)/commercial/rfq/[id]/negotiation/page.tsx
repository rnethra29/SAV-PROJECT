import type { Metadata } from "next";
import { getCurrentQuotation, getQuotationItems } from "@/modules/commercial-lifecycle/fixtures/quotation";
import { getNegotiationOffersByQuotationItem } from "@/modules/commercial-lifecycle/fixtures/negotiation";
import { getRfqItemById } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { NegotiationTimeline } from "@/modules/commercial-lifecycle/components/negotiation/NegotiationTimeline";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Negotiation · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqNegotiationPage({ params }: PageProps) {
  const { id } = await params;
  const quotation = await getCurrentQuotation(id);

  if (!quotation) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<UsersIcon className="h-8 w-8" />}
          title="No quotation to negotiate yet"
          description="Negotiation begins once a quotation has been submitted to the client."
        />
      </Panel>
    );
  }

  const items = await getQuotationItems(quotation.id);
  const threads = await Promise.all(
    items.map(async (item) => {
      const rfqItem = await getRfqItemById(item.rfqItemId);
      return {
        itemCode: item.itemCode,
        description: rfqItem?.description ?? "",
        offers: await getNegotiationOffersByQuotationItem(item.id),
      };
    }),
  );

  return <NegotiationTimeline threads={threads} />;
}
