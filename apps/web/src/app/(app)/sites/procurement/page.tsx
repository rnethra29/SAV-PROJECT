import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { AddProcurementOrderButton } from "@/components/sites/procurement/AddProcurementOrderButton";
import { ProcurementOrderListContainer } from "@/components/sites/procurement/ProcurementOrderListContainer";

export const metadata: Metadata = {
  title: "Purchase Orders · SAV ERP",
  description: "Direct procurement purchase orders raised against vendors.",
};

// Static shell — no server-side data fetch here, same reasoning as
// sites/vendors/page.tsx: GET /procurement-orders needs the browser's
// Supabase session, so ProcurementOrderListContainer does the actual fetch
// client-side.
export default function ProcurementOrderListPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Purchase Orders"
        description="Direct procurement purchase orders raised against vendors — distinct from the Commercial Lifecycle's subcontract POs."
        actions={<AddProcurementOrderButton />}
      />

      <ProcurementOrderListContainer />
    </div>
  );
}
