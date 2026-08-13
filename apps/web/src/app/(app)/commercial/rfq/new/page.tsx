import type { Metadata } from "next";
import { RfqFormWizard } from "@/components/commercial/rfq/RfqFormWizard";
import { getClientOptions, getProjectOptions, getSiteOptions } from "@/lib/fixtures/commercial-references";
import { getItemCategoryOptions } from "@/lib/fixtures/item-categories";

export const metadata: Metadata = {
  title: "New RFQ · SAV ERP",
  description: "Create a new Request for Quotation.",
};

export default async function NewRfqPage() {
  const [clients, projects, sites, categories] = await Promise.all([
    getClientOptions(),
    getProjectOptions(),
    getSiteOptions(),
    getItemCategoryOptions(),
  ]);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">New RFQ</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter the details from the client&apos;s RFQ document, then add its line items.
        </p>
      </div>

      <RfqFormWizard mode="create" clients={clients} projects={projects} sites={sites} categories={categories} />
    </div>
  );
}
