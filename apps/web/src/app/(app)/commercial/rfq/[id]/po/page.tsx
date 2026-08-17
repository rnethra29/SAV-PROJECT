import type { Metadata } from "next";
import { getPurchaseOrdersByRfqId } from "@/modules/commercial-lifecycle/fixtures/po";
import { PoListTable } from "@/modules/commercial-lifecycle/components/po/PoListTable";

export const metadata: Metadata = { title: "Purchase Orders · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqPoPage({ params }: PageProps) {
  const { id } = await params;
  const purchaseOrders = await getPurchaseOrdersByRfqId(id);
  return (
    <PoListTable
      purchaseOrders={purchaseOrders}
      emptyDescription="A purchase order is raised once the Final BOQ is approved."
    />
  );
}
