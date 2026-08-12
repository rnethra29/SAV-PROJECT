import type { Metadata } from "next";
import { getRfqItemTree } from "@/lib/fixtures/rfq";
import { RfqItemTree } from "@/components/commercial/rfq/RfqItemTree";

export const metadata: Metadata = { title: "RFQ Items · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqItemsPage({ params }: PageProps) {
  const { id } = await params;
  const tree = await getRfqItemTree(id);
  return <RfqItemTree tree={tree} />;
}
