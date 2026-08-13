import type { AuditLogEntry } from "@/types/commercial/shared";

/**
 * TEMPORARY FRONTEND FIXTURE — no Audit Log backend endpoint exists yet.
 * Replace with real apiFetch(`/audit-log?entityType=...&entityId=...`) calls
 * once the Express com_audit_log endpoint exists. Immutable/append-only by
 * design — the frontend never writes to this, only displays it.
 */

const userNames: Record<string, string> = {
  "usr-ramesh": "Ramesh Kumar",
  "usr-priya": "Priya Nair",
  "usr-arvind": "Arvind Rao",
  "usr-venkatesh": "S. Venkatesh",
};

export { userNames };

const auditFixtures: AuditLogEntry[] = [
  { id: "aud-0042-1", entityType: "rfq", entityId: "rfq-2026-0042", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { status: "draft" }, performedAt: "2026-01-15T09:30:00.000Z" },
  { id: "aud-0042-2", entityType: "rfq", entityId: "rfq-2026-0042", action: "status_change", userId: "usr-venkatesh", oldValue: { status: "draft" }, newValue: { status: "received" }, performedAt: "2026-01-16T10:05:00.000Z" },
  { id: "aud-0042-3", entityType: "rfq", entityId: "rfq-2026-0042", action: "status_change", userId: "usr-ramesh", oldValue: { status: "received" }, newValue: { status: "under_review" }, performedAt: "2026-01-16T14:00:00.000Z" },
  { id: "aud-0042-4", entityType: "estimation", entityId: "est-0042", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { estimationNumber: "EST-2026-0042" }, performedAt: "2026-01-17T09:00:00.000Z" },
  { id: "aud-0042-5", entityType: "rfq", entityId: "rfq-2026-0042", action: "status_change", userId: "usr-ramesh", oldValue: { status: "under_review" }, newValue: { status: "under_estimation" }, performedAt: "2026-01-17T09:05:00.000Z" },
  { id: "aud-0042-6", entityType: "estimation", entityId: "est-0042", action: "status_change", userId: "usr-venkatesh", oldValue: { status: "submitted_for_approval" }, newValue: { status: "approved" }, performedAt: "2026-01-19T14:30:00.000Z" },
  { id: "aud-0042-7", entityType: "actual_price", entityId: "ap-0042-21a", action: "insert", userId: "usr-priya", oldValue: null, newValue: { actualRate: 180 }, performedAt: "2026-01-20T09:00:00.000Z" },
  { id: "aud-0042-8", entityType: "quotation", entityId: "quo-0042-v1", action: "insert", userId: "usr-arvind", oldValue: null, newValue: { quotationNumber: "QTN-2026-0042", versionNo: 1 }, performedAt: "2026-01-30T10:00:00.000Z" },
  { id: "aud-0042-9", entityType: "rfq", entityId: "rfq-2026-0042", action: "status_change", userId: "usr-arvind", oldValue: { status: "under_estimation" }, newValue: { status: "quotation_prepared" }, performedAt: "2026-01-30T10:05:00.000Z" },
  { id: "aud-0042-10", entityType: "rfq", entityId: "rfq-2026-0042", action: "status_change", userId: "usr-arvind", oldValue: { status: "quotation_prepared" }, newValue: { status: "negotiation" }, performedAt: "2026-02-01T09:00:00.000Z" },
  { id: "aud-0042-11", entityType: "quotation", entityId: "quo-0042-v2", action: "insert", userId: "usr-arvind", oldValue: null, newValue: { quotationNumber: "QTN-2026-0042", versionNo: 2 }, performedAt: "2026-02-10T16:05:00.000Z" },
  { id: "aud-0042-12", entityType: "rfq", entityId: "rfq-2026-0042", action: "status_change", userId: "usr-arvind", oldValue: { status: "negotiation" }, newValue: { status: "won" }, performedAt: "2026-02-11T10:00:00.000Z" },
  { id: "aud-0042-13", entityType: "boq", entityId: "boq-0042-v1", action: "insert", userId: "usr-arvind", oldValue: null, newValue: { boqNumber: "BOQ-2026-0042", versionNo: 1, boqType: "tentative" }, performedAt: "2026-02-11T09:00:00.000Z" },
  { id: "aud-0042-14", entityType: "boq", entityId: "boq-0042-v2", action: "insert", userId: "usr-arvind", oldValue: null, newValue: { boqNumber: "BOQ-2026-0042", versionNo: 2, boqType: "final" }, performedAt: "2026-02-15T09:00:00.000Z" },
  { id: "aud-0042-15", entityType: "po", entityId: "po-0042-01", action: "insert", userId: "usr-arvind", oldValue: null, newValue: { poNumber: "PO-2026-0042-01" }, performedAt: "2026-02-20T10:00:00.000Z" },
  { id: "aud-0042-16", entityType: "po", entityId: "po-0042-02", action: "insert", userId: "usr-arvind", oldValue: null, newValue: { poNumber: "PO-2026-0042-02" }, performedAt: "2026-02-20T10:15:00.000Z" },

  { id: "aud-0031-1", entityType: "rfq", entityId: "rfq-2026-0031", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { status: "draft" }, performedAt: "2025-11-02T10:00:00.000Z" },
  { id: "aud-0031-2", entityType: "rfq", entityId: "rfq-2026-0031", action: "status_change", userId: "usr-arvind", oldValue: { status: "negotiation" }, newValue: { status: "won" }, performedAt: "2026-01-05T16:40:00.000Z" },

  { id: "aud-0028-1", entityType: "rfq", entityId: "rfq-2026-0028", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { status: "draft" }, performedAt: "2025-09-20T08:15:00.000Z" },
  { id: "aud-0028-2", entityType: "rfq", entityId: "rfq-2026-0028", action: "status_change", userId: "usr-arvind", oldValue: { status: "negotiation" }, newValue: { status: "lost" }, performedAt: "2025-10-18T13:20:00.000Z" },

  { id: "aud-0038-1", entityType: "rfq", entityId: "rfq-2026-0038", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { status: "draft" }, performedAt: "2025-12-10T11:30:00.000Z" },
  { id: "aud-0038-2", entityType: "rfq", entityId: "rfq-2026-0038", action: "status_change", userId: "usr-arvind", oldValue: { status: "quotation_prepared" }, newValue: { status: "negotiation" }, performedAt: "2026-01-28T15:10:00.000Z" },

  { id: "aud-0045-1", entityType: "rfq", entityId: "rfq-2026-0045", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { status: "draft" }, performedAt: "2026-01-25T09:00:00.000Z" },
  { id: "aud-0045-2", entityType: "rfq", entityId: "rfq-2026-0045", action: "status_change", userId: "usr-ramesh", oldValue: { status: "draft" }, newValue: { status: "received" }, performedAt: "2026-01-25T09:00:00.000Z" },

  { id: "aud-0051-1", entityType: "rfq", entityId: "rfq-2026-0051", action: "insert", userId: "usr-ramesh", oldValue: null, newValue: { status: "draft" }, performedAt: "2026-02-01T07:50:00.000Z" },
];

export async function getAuditLog(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
  return auditFixtures
    .filter((row) => row.entityType === entityType && row.entityId === entityId)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

export async function getAuditLogForRfq(rfqId: string, relatedEntityIds: { entityType: string; entityId: string }[]): Promise<AuditLogEntry[]> {
  const scoped = [{ entityType: "rfq", entityId: rfqId }, ...relatedEntityIds];
  const matches = (row: AuditLogEntry) =>
    scoped.some((s) => s.entityType === row.entityType && s.entityId === row.entityId);
  return auditFixtures.filter(matches).sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}
