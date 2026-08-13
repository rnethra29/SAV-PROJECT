import type { Approval, ApprovalEntityType } from "@/types/commercial/shared";

/**
 * TEMPORARY FRONTEND FIXTURE — no Approvals backend endpoint exists yet.
 * Replace with real apiFetch(`/approvals?entityType=...&entityId=...`) calls
 * once the Express com_approvals endpoint exists. This is a UI representation
 * only — no approval enforcement/RBAC gating happens on the frontend.
 */

const approvalFixtures: Approval[] = [
  { id: "apr-0042-rfq", entityType: "rfq", entityId: "rfq-2026-0042", approvalStage: "RFQ Intake", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-01-16T10:00:00.000Z", comments: "Scope and timeline confirmed with site team.", rejectionReason: null, createdAt: "2026-01-15T09:30:00.000Z" },
  { id: "apr-0042-est", entityType: "estimation", entityId: "est-0042", approvalStage: "Estimation Review", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-01-19T14:30:00.000Z", comments: "Cost build-up in line with historical rates.", rejectionReason: null, createdAt: "2026-01-17T09:00:00.000Z" },
  { id: "apr-0042-quo", entityType: "quotation", entityId: "quo-0042-v2", approvalStage: "Quotation Approval", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-02-11T09:00:00.000Z", comments: "Final rates approved for issue.", rejectionReason: null, createdAt: "2026-02-10T16:05:00.000Z" },
  { id: "apr-0042-fcd", entityType: "final_commercial_decision", entityId: "rfq-2026-0042", approvalStage: "Final Commercial Decision", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-02-11T10:00:00.000Z", comments: "Deal closed at negotiated rates.", rejectionReason: null, createdAt: "2026-02-10T17:00:00.000Z" },
  { id: "apr-0042-boq", entityType: "boq", entityId: "boq-0042-v2", approvalStage: "Final BOQ Approval", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-02-15T11:00:00.000Z", comments: "Final BOQ matches settled commercial position.", rejectionReason: null, createdAt: "2026-02-15T09:00:00.000Z" },
  { id: "apr-0042-po1", entityType: "po", entityId: "po-0042-01", approvalStage: "PO Approval", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-02-20T10:10:00.000Z", comments: null, rejectionReason: null, createdAt: "2026-02-20T10:00:00.000Z" },
  { id: "apr-0042-po2", entityType: "po", entityId: "po-0042-02", approvalStage: "PO Approval", approverId: "usr-venkatesh", status: "approved", approvedAt: "2026-02-20T10:20:00.000Z", comments: null, rejectionReason: null, createdAt: "2026-02-20T10:15:00.000Z" },

  { id: "apr-0031-rfq", entityType: "rfq", entityId: "rfq-2026-0031", approvalStage: "RFQ Intake", approverId: "usr-venkatesh", status: "approved", approvedAt: "2025-11-03T10:00:00.000Z", comments: null, rejectionReason: null, createdAt: "2025-11-02T10:00:00.000Z" },
  { id: "apr-0031-quo", entityType: "quotation", entityId: "quo-0031-v1", approvalStage: "Quotation Approval", approverId: "usr-venkatesh", status: "approved", approvedAt: "2025-11-11T10:00:00.000Z", comments: null, rejectionReason: null, createdAt: "2025-11-10T10:00:00.000Z" },

  { id: "apr-0028-rfq", entityType: "rfq", entityId: "rfq-2026-0028", approvalStage: "RFQ Intake", approverId: "usr-venkatesh", status: "approved", approvedAt: "2025-09-21T10:00:00.000Z", comments: null, rejectionReason: null, createdAt: "2025-09-20T08:15:00.000Z" },
  { id: "apr-0028-quo", entityType: "quotation", entityId: "quo-0028-v1", approvalStage: "Quotation Approval", approverId: "usr-venkatesh", status: "rejected", approvedAt: null, comments: null, rejectionReason: "Commercial position not accepted by client — RFQ lost.", createdAt: "2025-09-26T10:00:00.000Z" },

  { id: "apr-0038-rfq", entityType: "rfq", entityId: "rfq-2026-0038", approvalStage: "RFQ Intake", approverId: "usr-venkatesh", status: "approved", approvedAt: "2025-12-11T10:00:00.000Z", comments: null, rejectionReason: null, createdAt: "2025-12-10T11:30:00.000Z" },
  { id: "apr-0038-quo", entityType: "quotation", entityId: "quo-0038-v1", approvalStage: "Quotation Approval", approverId: "usr-venkatesh", status: "pending", approvedAt: null, comments: null, rejectionReason: null, createdAt: "2025-12-18T10:00:00.000Z" },

  { id: "apr-0045-rfq", entityType: "rfq", entityId: "rfq-2026-0045", approvalStage: "RFQ Intake", approverId: "usr-venkatesh", status: "pending", approvedAt: null, comments: null, rejectionReason: null, createdAt: "2026-01-25T09:00:00.000Z" },
];

export async function getApprovals(entityType: ApprovalEntityType, entityId: string): Promise<Approval[]> {
  return approvalFixtures
    .filter((row) => row.entityType === entityType && row.entityId === entityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApprovalsForEntities(
  entityType: ApprovalEntityType,
  entityIds: string[],
): Promise<Approval[]> {
  const idSet = new Set(entityIds);
  return approvalFixtures.filter((row) => row.entityType === entityType && idSet.has(row.entityId));
}
