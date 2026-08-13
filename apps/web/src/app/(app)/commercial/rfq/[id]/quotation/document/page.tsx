import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronLeftIcon, InboxIcon } from "@/components/ui/icons";
import { getRfqById, getRfqItems } from "@/lib/fixtures/rfq";
import { getSiteOptions } from "@/lib/fixtures/commercial-references";
import { getQuotationVersions, getQuotationItems } from "@/lib/fixtures/quotation";
import { QuotationDocumentPreview, type QuotationDocumentLine } from "@/components/commercial/quotation/QuotationDocumentPreview";
import { DocumentActionBar } from "@/components/commercial/shared/DocumentActionBar";

export const metadata: Metadata = { title: "Quotation Document · SAV ERP" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
};

export default async function QuotationDocumentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { v } = await searchParams;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const versions = await getQuotationVersions(id);
  const backLink = (
    <Link
      href={`/commercial/rfq/${id}/quotation`}
      className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2 print:hidden"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {rfq.rfqNumber} · Quotation
    </Link>
  );

  if (versions.length === 0) {
    return (
      <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
        {backLink}
        <Panel className="bg-surface">
          <EmptyState icon={<InboxIcon className="h-8 w-8" />} title="No quotation available" description="A document preview is available once a quotation has been drafted for this RFQ." />
        </Panel>
      </div>
    );
  }

  const requestedVersion = v ? Number(v) : null;
  const activeVersion = versions.find((version) => version.versionNo === requestedVersion) ?? versions[versions.length - 1];

  const [sites, items, rfqItems] = await Promise.all([
    getSiteOptions(),
    getQuotationItems(activeVersion.id),
    getRfqItems(id),
  ]);
  const siteName = sites.find((s) => s.id === rfq.siteId)?.name ?? null;
  const descriptionByRfqItemId = new Map(rfqItems.map((item) => [item.id, item.description]));
  const lines: QuotationDocumentLine[] = items.map((item) => ({
    ...item,
    description: descriptionByRfqItemId.get(item.rfqItemId) ?? item.itemCode,
  }));

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          {backLink}
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
            {activeVersion.quotationNumber} · Document Preview
          </h1>
          {versions.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {versions.map((version) => (
                <Link
                  key={version.id}
                  href={`/commercial/rfq/${id}/quotation/document?v=${version.versionNo}`}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    version.id === activeVersion.id
                      ? "border-primary bg-primary/10 text-text-primary"
                      : "border-border text-text-secondary hover:border-secondary"
                  }`}
                >
                  Version {version.versionNo}
                </Link>
              ))}
            </div>
          )}
        </div>
        <DocumentActionBar entity="quotation" documentNumber={`${activeVersion.quotationNumber}-v${activeVersion.versionNo}`} />
      </div>

      <QuotationDocumentPreview
        rfqNumber={rfq.rfqNumber}
        clientName={rfq.clientName}
        projectName={rfq.projectName}
        siteName={siteName}
        quotation={activeVersion}
        lines={lines}
      />
    </div>
  );
}
