import type { Metadata } from "next";
import { getEstimationByRfqId } from "@/modules/commercial-lifecycle/fixtures/estimation";
import { getQuotationVersions } from "@/modules/commercial-lifecycle/fixtures/quotation";
import { getBoqVersions } from "@/modules/commercial-lifecycle/fixtures/boq";
import { getPurchaseOrdersByRfqId } from "@/modules/commercial-lifecycle/fixtures/po";
import { getAuditLogForRfq } from "@/modules/commercial-lifecycle/fixtures/audit";
import { AuditTrailPanel } from "@/modules/commercial-lifecycle/components/shared/AuditTrailPanel";

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
