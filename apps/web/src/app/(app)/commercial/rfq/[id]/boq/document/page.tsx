import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, LayersIcon } from "@/components/ui/icons";
import { getRfqById } from "@/lib/fixtures/rfq";
import { getSiteOptions } from "@/lib/fixtures/commercial-references";
import { getBoqVersions, getBoqItemTree } from "@/lib/fixtures/boq";
import { flattenBoqTree } from "@/lib/commercial/boq-generation";
import { BoqDocumentPreview } from "@/components/commercial/boq/BoqDocumentPreview";
import { DocumentActionBar } from "@/components/commercial/shared/DocumentActionBar";

export const metadata: Metadata = { title: "BOQ Document · SAV ERP" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
};

export default async function BoqDocumentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { v } = await searchParams;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const versions = await getBoqVersions(id);
  const backLink = (
    <Link
      href={`/commercial/rfq/${id}/boq`}
      className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2 print:hidden"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {rfq.rfqNumber} · BOQ
    </Link>
  );

  if (versions.length === 0) {
    return (
      <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
        {backLink}
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No BOQ available"
            description="A document preview is available once a BOQ has been created for this RFQ."
            action={
              <Link href={`/commercial/rfq/${id}/boq/new`}>
                <Button>Create BOQ</Button>
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  const requestedVersion = v ? Number(v) : null;
  const activeBoq = versions.find((boq) => boq.versionNo === requestedVersion) ?? versions[versions.length - 1];

  const [sites, tree] = await Promise.all([getSiteOptions(), getBoqItemTree(activeBoq.id)]);
  const siteName = sites.find((s) => s.id === rfq.siteId)?.name ?? null;
  const lines = flattenBoqTree(tree);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          {backLink}
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
            {activeBoq.boqNumber} · Document Preview
          </h1>
          {versions.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {versions.map((boq) => (
                <Link
                  key={boq.id}
                  href={`/commercial/rfq/${id}/boq/document?v=${boq.versionNo}`}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    boq.id === activeBoq.id
                      ? "border-primary bg-primary/10 text-text-primary"
                      : "border-border text-text-secondary hover:border-secondary"
                  }`}
                >
                  v{boq.versionNo} · {boq.boqType === "final" ? "Final" : "Tentative"}
                </Link>
              ))}
            </div>
          )}
        </div>
        <DocumentActionBar entity="boq" documentNumber={`${activeBoq.boqNumber}-v${activeBoq.versionNo}`} />
      </div>

      <BoqDocumentPreview
        boqNumber={activeBoq.boqNumber}
        versionNo={activeBoq.versionNo}
        boqType={activeBoq.boqType}
        status={activeBoq.status}
        title={activeBoq.boqTitle}
        date={activeBoq.createdAt}
        clientName={rfq.clientName}
        projectName={rfq.projectName}
        siteName={siteName}
        rfqNumber={rfq.rfqNumber}
        revisionReason={activeBoq.revisionReason}
        remarks={activeBoq.remarks}
        lines={lines}
      />
    </div>
  );
}
