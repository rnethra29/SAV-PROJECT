import type { Metadata } from "next";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { ClientCreateContainer } from "@/components/sites/client/ClientCreateContainer";

export const metadata: Metadata = {
  title: "New Client · SAV ERP",
  description: "Create a new client master record.",
};

// Static shell — no server-side data fetch here, same reasoning as the
// Client list page: the lookup options this form needs (client types,
// industries) sit behind `authenticate` too, so ClientCreateContainer loads
// them client-side after mount.
export default function NewClientPage() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <PageHeader title="New Client" description="Create a new client master record." />

      <ClientCreateContainer />
    </div>
  );
}
