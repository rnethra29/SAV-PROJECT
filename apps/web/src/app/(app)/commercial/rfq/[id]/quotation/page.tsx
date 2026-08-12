import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon } from "@/components/ui/icons";
import { getQuotationVersions, getQuotationItems } from "@/lib/fixtures/quotation";
import { QuotationVersionPanel } from "@/components/commercial/quotation/QuotationVersionPanel";

export const metadata: Metadata = { title: "Quotation · SAV ERP" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
};

export default async function RfqQuotationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { v } = await searchParams;
  const versions = await getQuotationVersions(id);

  if (versions.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="No quotation yet"
          description="A quotation has not been drafted for this RFQ yet."
        />
      </Panel>
    );
  }

  const requestedVersion = v ? Number(v) : null;
  const activeVersion =
    versions.find((version) => version.versionNo === requestedVersion) ?? versions[versions.length - 1];
  const activeIndex = versions.findIndex((version) => version.id === activeVersion.id);
  const previousVersion = activeIndex > 0 ? versions[activeIndex - 1] : null;

  const [items, previousItems] = await Promise.all([
    getQuotationItems(activeVersion.id),
    previousVersion ? getQuotationItems(previousVersion.id) : Promise.resolve(null),
  ]);

  return (
    <QuotationVersionPanel
      rfqId={id}
      versions={versions}
      activeVersion={activeVersion}
      items={items}
      previousItems={previousItems}
    />
  );
}
