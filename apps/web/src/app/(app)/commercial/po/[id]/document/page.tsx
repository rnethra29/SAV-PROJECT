import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { getPurchaseOrderById, getPoItems } from "@/modules/commercial-lifecycle/fixtures/po";
import { getRfqById } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getBoqById } from "@/modules/commercial-lifecycle/fixtures/boq";
import { getProjectOptions, getSiteOptions } from "@/modules/commercial-lifecycle/fixtures/commercial-references";
import { PoDocumentPreview, type PoPreviewLine } from "@/modules/commercial-lifecycle/components/po/PoDocumentPreview";
import { DocumentActionBar } from "@/modules/commercial-lifecycle/components/shared/DocumentActionBar";

export const metadata: Metadata = { title: "PO Document · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function PoDocumentPage({ params }: PageProps) {
  const { id } = await params;
  const po = await getPurchaseOrderById(id);
  if (!po) notFound();

  const [items, rfq, boq, projects, sites] = await Promise.all([
    getPoItems(po.id),
    po.rfqId ? getRfqById(po.rfqId) : Promise.resolve(null),
    po.boqId ? getBoqById(po.boqId) : Promise.resolve(null),
    getProjectOptions(),
    getSiteOptions(),
  ]);
  const projectName = projects.find((p) => p.id === po.projectId)?.name ?? "—";
  const siteName = po.siteId ? sites.find((s) => s.id === po.siteId)?.name ?? null : null;
  const lines: PoPreviewLine[] = items.map((item) => ({
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    rate: item.rate,
    taxPercentage: item.taxPercentage,
    remarks: item.remarks,
  }));

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link
            href={`/commercial/po/${id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {po.poNumber}
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
            {po.poNumber} · Document Preview
          </h1>
        </div>
        <DocumentActionBar entity="po" documentNumber={po.poNumber} />
      </div>

      <PoDocumentPreview
        poNumber={po.poNumber}
        poDate={po.poDate}
        vendorName={po.vendorName}
        projectName={projectName}
        siteName={siteName}
        rfqNumber={rfq?.rfqNumber ?? "—"}
        boqNumber={boq?.boqNumber ?? "—"}
        status={po.status}
        paymentTerms={po.paymentTerms}
        deliveryTimeline={po.deliveryTimeline}
        termsAndConditions={po.termsAndConditions}
        remarks={po.remarks}
        lines={lines}
      />
    </div>
  );
}
