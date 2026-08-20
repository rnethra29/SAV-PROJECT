import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { VendorCreateContainer } from "@/components/sites/vendor/VendorCreateContainer";

export const metadata: Metadata = {
  title: "New Vendor · SAV ERP",
  description: "Create a new vendor master record.",
};

// Static shell — same reasoning as sites/clients/new/page.tsx: the lookup
// options this form needs (vendor types) sit behind `authenticate` too, so
// VendorCreateContainer loads them client-side after mount.
export default function NewVendorPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <PageHeader title="New Vendor" description="Create a new vendor master record." />

      <VendorCreateContainer />
    </div>
  );
}
