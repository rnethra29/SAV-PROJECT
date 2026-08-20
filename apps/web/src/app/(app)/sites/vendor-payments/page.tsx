import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { AddVendorPaymentButton } from "@/components/sites/vendor-payment/AddVendorPaymentButton";
import { VendorPaymentListContainer } from "@/components/sites/vendor-payment/VendorPaymentListContainer";

export const metadata: Metadata = {
  title: "Vendor Payments · SAV ERP",
  description: "Payments made to vendors, allocated against invoices.",
};

export default function VendorPaymentListPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Vendor Payments"
        description="Payments made to vendors, allocated against invoices."
        actions={<AddVendorPaymentButton />}
      />

      <VendorPaymentListContainer />
    </div>
  );
}
