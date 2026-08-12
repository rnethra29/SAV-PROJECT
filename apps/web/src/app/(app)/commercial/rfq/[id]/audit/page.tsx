import type { Metadata } from "next";
import { getEstimationByRfqId } from "@/lib/fixtures/estimation";
import { getQuotationVersions } from "@/lib/fixtures/quotation";
import { getBoqVersions } from "@/lib/fixtures/boq";
import { getPurchaseOrdersByRfqId } from "@/lib/fixtures/po";
import { getAuditLogForRfq } from "@/lib/fixtures/audit";
import { AuditTrailPanel } from "@/components/commercial/shared/AuditTrailPanel";

export const metadata: Metadata = { title: "RFQ Audit Trail · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqAuditPage({ params }: PageProps) {
  const { id } = await params;
  const [estimation, quotations, boqs, purchaseOrders] = await Promise.all([
    getEstimationByRfqId(id),
    getQuotationVersions(id),
    getBoqVersions(id),
    getPurchaseOrdersByRfqId(id),
  ]);

  const relatedEntityIds = [
    ...(estimation ? [{ entityType: "estimation", entityId: estimation.id }] : []),
    ...quotations.map((q) => ({ entityType: "quotation", entityId: q.id })),
    ...boqs.map((b) => ({ entityType: "boq", entityId: b.id })),
    ...purchaseOrders.map((po) => ({ entityType: "po", entityId: po.id })),
  ];

  const entries = await getAuditLogForRfq(id, relatedEntityIds);
  return <AuditTrailPanel entries={entries} title="RFQ Audit Trail" />;
}
