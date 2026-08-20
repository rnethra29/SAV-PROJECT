import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { ProcurementOrderCreateContainer } from "@/components/sites/procurement/ProcurementOrderCreateContainer";

export const metadata: Metadata = {
  title: "New Purchase Order · SAV ERP",
  description: "Create a new procurement purchase order.",
};

// Static shell — same reasoning as sites/vendors/new/page.tsx: the lookup
// options this form needs (vendors, projects) sit behind `authenticate`
// too, so ProcurementOrderCreateContainer loads them client-side.
export default function NewProcurementOrderPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <PageHeader title="New Purchase Order" description="Create a new procurement purchase order." />

      <ProcurementOrderCreateContainer />
    </div>
  );
}
