import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { getRfqById } from "@/lib/fixtures/rfq";
import { getSiteOptions } from "@/lib/fixtures/commercial-references";
import { getBoqVersions } from "@/lib/fixtures/boq";
import { buildBoqDraftFromRfq, buildBoqDraftFromPreviousBoq } from "@/lib/commercial/boq-generation";
import { BoqCreateWizard } from "@/components/commercial/boq/BoqCreateWizard";

export const metadata: Metadata = { title: "Create BOQ · SAV ERP" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revise?: string }>;
};

export default async function CreateBoqPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { revise } = await searchParams;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const [sites, versions] = await Promise.all([getSiteOptions(), getBoqVersions(id)]);
  const siteName = sites.find((s) => s.id === rfq.siteId)?.name ?? null;

  const previousBoq = revise ? versions.find((v) => v.id === revise) ?? versions[versions.length - 1] : null;
  const mode = previousBoq ? "revise" : "create";

  const initialLines = previousBoq
    ? await buildBoqDraftFromPreviousBoq(previousBoq.id)
    : await buildBoqDraftFromRfq(id);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <div>
        <Link
          href={`/commercial/rfq/${id}/boq`}
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {rfq.rfqNumber} · BOQ
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
          {mode === "revise" ? `New Revision — ${previousBoq?.boqNumber}` : "Create BOQ"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {mode === "revise"
            ? "Draft items are carried from the current version — adjust rates or quantities before saving as a new version."
            : "Draft items and rates are pulled from this RFQ's settled commercial position — review and adjust before saving."}
        </p>
      </div>

      <BoqCreateWizard
        rfqId={id}
        rfqNumber={rfq.rfqNumber}
        clientName={rfq.clientName}
        projectName={rfq.projectName}
        siteName={siteName}
        mode={mode}
        boqNumber={previousBoq?.boqNumber ?? "Auto-generated on save"}
        nextVersionNo={previousBoq ? previousBoq.versionNo + 1 : 1}
        defaultTitle={`${rfq.projectName} — ${mode === "revise" ? "Revised" : "Tentative"} BOQ`}
        initialLines={initialLines}
      />
    </div>
  );
}
