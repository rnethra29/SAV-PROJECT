import type { Metadata } from "next";
import { VendorInvoiceDetailContainer } from "@/components/sites/vendor-invoice/VendorInvoiceDetailContainer";

export const metadata: Metadata = {
  title: "Vendor Invoice · SAV ERP",
  description: "Vendor invoice detail.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <VendorInvoiceDetailContainer invoiceId={id} />
    </div>
  );
}
