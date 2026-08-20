import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { AddVendorInvoiceButton } from "@/components/sites/vendor-invoice/AddVendorInvoiceButton";
import { VendorInvoiceListContainer } from "@/components/sites/vendor-invoice/VendorInvoiceListContainer";

export const metadata: Metadata = {
  title: "Vendor Invoices · SAV ERP",
  description: "Invoices received from vendors, reconciled against purchase order items.",
};

// Static shell — no server-side data fetch here, same reasoning as
// sites/procurement/page.tsx: GET /vendor-invoices needs the browser's
// Supabase session, so VendorInvoiceListContainer does the actual fetch.
export default function VendorInvoiceListPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Vendor Invoices"
        description="Invoices received from vendors, reconciled against purchase order items."
        actions={<AddVendorInvoiceButton />}
      />

      <VendorInvoiceListContainer />
    </div>
  );
}
