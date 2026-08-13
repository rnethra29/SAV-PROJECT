import type { Metadata } from "next";
import Link from "next/link";
import { RfqListView } from "@/components/commercial/rfq/RfqListView";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
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
      <PageHeader
        title="Requests for Quotation"
        description="Track incoming client requests from intake through to quotation."
        actions={
          <Link href="/commercial/rfq/new">
            <Button>
              <PlusIcon className="h-4 w-4" />
              New RFQ
            </Button>
          </Link>
        }
      />

      <RfqListView rfqs={rfqs} />
    </div>
  );
}
