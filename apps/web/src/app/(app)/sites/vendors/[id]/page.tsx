import type { Metadata } from "next";
import { VendorDetailContainer } from "@/components/sites/vendor/VendorDetailContainer";

export const metadata: Metadata = {
  title: "Vendor · SAV ERP",
  description: "Vendor profile.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// Static shell — same reasoning as sites/clients/[id]/page.tsx: GET
// /vendors/:id needs the browser's Supabase session, so
// VendorDetailContainer does the actual fetch client-side after mount.
export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <VendorDetailContainer vendorId={id} />
    </div>
  );
}
