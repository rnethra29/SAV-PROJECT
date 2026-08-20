import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { VendorPaymentCreateContainer } from "@/components/sites/vendor-payment/VendorPaymentCreateContainer";

export const metadata: Metadata = {
  title: "New Vendor Payment · SAV ERP",
  description: "Record a new payment made to a vendor.",
};

export default function NewVendorPaymentPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <PageHeader title="New Vendor Payment" description="Record a new payment made to a vendor." />

      <VendorPaymentCreateContainer />
    </div>
  );
}
