import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { AddClientButton } from "@/components/sites/client/AddClientButton";
import { ClientListContainer } from "@/components/sites/client/ClientListContainer";

export const metadata: Metadata = {
  title: "Clients · SAV ERP",
  description: "Manage client relationships, requirements, projects, billing and activity.",
};

// Static shell — no server-side data fetch here. GET /clients needs the
// browser's Supabase session (see ClientListContainer), which a Server
// Component render has no access to, so the actual request happens
// entirely client-side after mount.
export default function ClientListPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Clients"
        description="Manage client relationships, requirements, projects, billing and activity."
        actions={<AddClientButton />}
      />

      <ClientListContainer />
    </div>
  );
}
