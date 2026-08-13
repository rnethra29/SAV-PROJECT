import type { Metadata } from "next";
import { getQuotationVersions } from "@/lib/fixtures/quotation";
import { getBoqVersions } from "@/lib/fixtures/boq";
import { RfqRevisionsPanel } from "@/components/commercial/rfq/RfqRevisionsPanel";

export const metadata: Metadata = { title: "RFQ Revisions · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqRevisionsPage({ params }: PageProps) {
  const { id } = await params;
  const [quotationVersions, boqVersions] = await Promise.all([getQuotationVersions(id), getBoqVersions(id)]);
  return <RfqRevisionsPanel rfqId={id} quotationVersions={quotationVersions} boqVersions={boqVersions} />;
}
