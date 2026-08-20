import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { VendorInvoiceCreateContainer } from "@/components/sites/vendor-invoice/VendorInvoiceCreateContainer";

export const metadata: Metadata = {
  title: "New Vendor Invoice · SAV ERP",
  description: "Record a new invoice received from a vendor.",
};

export default function NewVendorInvoicePage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <PageHeader title="New Vendor Invoice" description="Record a new invoice received from a vendor." />

      <VendorInvoiceCreateContainer />
    </div>
  );
}
