import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { getRfqById, getRfqItemTree } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getSiteOptions } from "@/modules/commercial-lifecycle/fixtures/commercial-references";
import { getDocuments } from "@/modules/commercial-lifecycle/fixtures/documents";
import { getApprovals } from "@/modules/commercial-lifecycle/fixtures/approvals";
import { RfqDocumentPreview } from "@/modules/commercial-lifecycle/components/rfq/RfqDocumentPreview";
import { DocumentActionBar } from "@/modules/commercial-lifecycle/components/shared/DocumentActionBar";

export const metadata: Metadata = { title: "RFQ Document · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqDocumentPage({ params }: PageProps) {
  const { id } = await params;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const [sites, tree, documents, approvals] = await Promise.all([
    getSiteOptions(),
    getRfqItemTree(id),
    getDocuments("rfq", id),
    getApprovals("rfq", id),
  ]);
  const siteName = sites.find((s) => s.id === rfq.siteId)?.name ?? null;

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link
            href={`/commercial/rfq/${id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {rfq.rfqNumber}
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
            {rfq.rfqNumber} · Document Preview
          </h1>
        </div>
        <DocumentActionBar entity="rfq" documentNumber={rfq.rfqNumber} />
      </div>

      <RfqDocumentPreview rfq={rfq} siteName={siteName} tree={tree} documents={documents} approvals={approvals} />
    </div>
  );
}
