import type { Metadata } from "next";
import { ProcurementOrderDetailContainer } from "@/components/sites/procurement/ProcurementOrderDetailContainer";

export const metadata: Metadata = {
  title: "Purchase Order · SAV ERP",
  description: "Purchase order detail.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// Static shell — same reasoning as sites/vendors/[id]/page.tsx: GET
// /procurement-orders/:id needs the browser's Supabase session, so
// ProcurementOrderDetailContainer does the actual fetch client-side.
export default async function ProcurementOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <ProcurementOrderDetailContainer poId={id} />
    </div>
  );
}
