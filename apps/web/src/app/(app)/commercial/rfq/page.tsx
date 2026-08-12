import type { Metadata } from "next";
import Link from "next/link";
import { RfqListView } from "@/components/commercial/rfq/RfqListView";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { getRfqList } from "@/lib/fixtures/rfq";

export const metadata: Metadata = {
  title: "RFQs · SAV ERP",
  description: "Requests for Quotation received from clients.",
};

export default async function RfqListPage() {
  const rfqs = await getRfqList();

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
            Requests for Quotation
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            RFQs received from clients, tracked from intake through to quotation.
          </p>
        </div>
        <Link href="/commercial/rfq/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            New RFQ
          </Button>
        </Link>
      </div>

      <RfqListView rfqs={rfqs} />
    </div>
  );
}
