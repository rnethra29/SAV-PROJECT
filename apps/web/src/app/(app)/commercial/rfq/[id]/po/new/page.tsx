import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, LayersIcon } from "@/components/ui/icons";
import { getRfqById } from "@/lib/fixtures/rfq";
import { getSiteOptions, getVendorOptions } from "@/lib/fixtures/commercial-references";
import { getCurrentBoq } from "@/lib/fixtures/boq";
import { getPurchaseOrdersByBoqId } from "@/lib/fixtures/po";
import { buildPoDraftFromBoq } from "@/lib/commercial/po-generation";
import { PoCreateWizard } from "@/components/commercial/po/PoCreateWizard";

export const metadata: Metadata = { title: "Create PO · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function CreatePoPage({ params }: PageProps) {
  const { id } = await params;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const boq = await getCurrentBoq(id);
  const backLink = (
    <Link
      href={`/commercial/rfq/${id}/boq`}
      className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {rfq.rfqNumber} · BOQ
    </Link>
  );

  if (!boq || boq.boqType !== "final") {
    return (
      <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
        <div>{backLink}</div>
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="A Final BOQ is required"
            description="A Purchase Order can only be raised once this RFQ has a Final BOQ. Finalize the BOQ first, then create the PO from there."
            action={
              <Link href={`/commercial/rfq/${id}/boq`}>
                <Button>Go to BOQ</Button>
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  const [sites, vendors, existingPos, initialLines] = await Promise.all([
    getSiteOptions(),
    getVendorOptions(),
    getPurchaseOrdersByBoqId(boq.id),
    buildPoDraftFromBoq(boq.id),
  ]);
  const siteName = sites.find((s) => s.id === rfq.siteId)?.name ?? null;

  if (existingPos.length > 0) {
    return (
      <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
        <div>{backLink}</div>
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="A PO already exists for this BOQ"
            description="This Final BOQ already has one or more purchase orders raised against it. Open the BOQ to review them."
            action={
              <Link href={`/commercial/rfq/${id}/boq`}>
                <Button>Go to BOQ</Button>
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <div>
        {backLink}
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">Create PO</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Draft items are pulled from {boq.boqNumber} — review the vendor split before saving.
        </p>
      </div>

      <PoCreateWizard
        rfqId={id}
        rfqNumber={rfq.rfqNumber}
        boqNumber={boq.boqNumber}
        projectName={rfq.projectName}
        siteName={siteName}
        vendorOptions={vendors}
        initialLines={initialLines}
      />
    </div>
  );
}
