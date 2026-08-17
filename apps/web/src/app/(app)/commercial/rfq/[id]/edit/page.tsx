import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RfqFormWizard } from "@/modules/commercial-lifecycle/components/rfq/RfqFormWizard";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { getRfqById, getRfqItems, isHeaderRfqItem } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getClientOptions, getProjectOptions, getSiteOptions } from "@/modules/commercial-lifecycle/fixtures/commercial-references";
import { getItemCategoryOptions } from "@/modules/commercial-lifecycle/fixtures/item-categories";
import type { DraftRfqItem } from "@/modules/commercial-lifecycle/components/rfq/RfqItemsEditor";

export const metadata: Metadata = { title: "Edit RFQ · SAV ERP" };

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> };

export default async function EditRfqPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { step } = await searchParams;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const [items, clients, projects, sites, categories] = await Promise.all([
    getRfqItems(id),
    getClientOptions(),
    getProjectOptions(),
    getSiteOptions(),
    getItemCategoryOptions(),
  ]);

  const draftItems: DraftRfqItem[] = items.map((item) => ({
    key: item.id,
    itemCode: item.itemCode,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    categoryId: item.categoryId,
    remarks: item.remarks ?? "",
    isHeader: isHeaderRfqItem(item),
  }));

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <div>
        <Link
          href={`/commercial/rfq/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {rfq.rfqNumber}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
          Edit {rfq.rfqNumber}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Update RFQ details and line items.</p>
      </div>

      <RfqFormWizard
        mode="edit"
        clients={clients}
        projects={projects}
        sites={sites}
        categories={categories}
        initialRfq={rfq}
        initialItems={draftItems}
        initialStep={step === "items" ? 1 : 0}
      />
    </div>
  );
}
