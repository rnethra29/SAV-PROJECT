import type { Metadata } from "next";
import { getQuotationVersions } from "@/modules/commercial-lifecycle/fixtures/quotation";
import { getBoqVersions } from "@/modules/commercial-lifecycle/fixtures/boq";
import { RfqRevisionsPanel } from "@/modules/commercial-lifecycle/components/rfq/RfqRevisionsPanel";

export const metadata: Metadata = { title: "RFQ Revisions · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqRevisionsPage({ params }: PageProps) {
  const { id } = await params;
  const [quotationVersions, boqVersions] = await Promise.all([getQuotationVersions(id), getBoqVersions(id)]);
  return <RfqRevisionsPanel rfqId={id} quotationVersions={quotationVersions} boqVersions={boqVersions} />;
}
