import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { AddVendorButton } from "@/components/sites/vendor/AddVendorButton";
import { VendorListContainer } from "@/components/sites/vendor/VendorListContainer";

export const metadata: Metadata = {
  title: "Vendors · SAV ERP",
  description: "Manage vendor relationships, contacts, bank accounts and catalog.",
};

// Static shell — no server-side data fetch here, same reasoning as
// sites/clients/page.tsx: GET /vendors needs the browser's Supabase
// session, so VendorListContainer does the actual fetch client-side.
export default function VendorListPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Vendors"
        description="Manage vendor relationships, contacts, bank accounts and catalog."
        actions={<AddVendorButton />}
      />

      <VendorListContainer />
    </div>
  );
}
