import type { Metadata } from "next";
import { RfqCreateForm } from "@/components/commercial/rfq/RfqCreateForm";
import { getClientOptions, getProjectOptions, getSiteOptions } from "@/lib/fixtures/commercial-references";

export const metadata: Metadata = {
  title: "New RFQ · SAV ERP",
  description: "Create a new Request for Quotation.",
};

export default async function NewRfqPage() {
  const [clients, projects, sites] = await Promise.all([
    getClientOptions(),
    getProjectOptions(),
    getSiteOptions(),
  ]);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[900px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">New RFQ</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter the details from the client&apos;s RFQ document. Items are added after the RFQ is saved.
        </p>
      </div>

      <RfqCreateForm clients={clients} projects={projects} sites={sites} />
    </div>
  );
}
