import type { Metadata } from "next";
import { getApprovals } from "@/lib/fixtures/approvals";
import { ApprovalsPanel } from "@/components/commercial/shared/ApprovalsPanel";

export const metadata: Metadata = { title: "RFQ Approvals · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqApprovalsPage({ params }: PageProps) {
  const { id } = await params;
  const approvals = await getApprovals("rfq", id);
  return <ApprovalsPanel approvals={approvals} title="RFQ Approvals" />;
}
