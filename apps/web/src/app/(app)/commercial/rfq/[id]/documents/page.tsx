import type { Metadata } from "next";
import { getDocuments } from "@/modules/commercial-lifecycle/fixtures/documents";
import { DocumentsPanel } from "@/modules/commercial-lifecycle/components/shared/DocumentsPanel";

export const metadata: Metadata = { title: "RFQ Documents · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqDocumentsPage({ params }: PageProps) {
  const { id } = await params;
  const documents = await getDocuments("rfq", id);
  return <DocumentsPanel documents={documents} title="RFQ Documents" />;
}
