import type { Metadata } from "next";
import { ClientDetailContainer } from "@/components/sites/client/ClientDetailContainer";

export const metadata: Metadata = {
  title: "Client · SAV ERP",
  description: "Client profile.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// Static shell — same reasoning as clients/page.tsx: GET /clients/:id needs
// the browser's Supabase session, so ClientDetailContainer does the actual
// fetch client-side after mount.
export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <ClientDetailContainer clientId={id} />
    </div>
  );
}
