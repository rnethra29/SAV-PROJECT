import type { Metadata } from "next";
import { VendorPaymentDetailContainer } from "@/components/sites/vendor-payment/VendorPaymentDetailContainer";

export const metadata: Metadata = {
  title: "Vendor Payment · SAV ERP",
  description: "Vendor payment detail.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorPaymentDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <VendorPaymentDetailContainer paymentId={id} />
    </div>
  );
}
