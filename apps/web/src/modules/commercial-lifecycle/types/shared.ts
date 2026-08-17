export type DocumentEntityType =
  | "rfq"
  | "estimation"
  | "quotation"
  | "negotiation"
  | "client_offer"
  | "boq"
  | "po";

export type DocumentStatus = "active" | "superseded" | "archived";

export type CommercialDocument = {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  documentCategoryId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSizeBytes: number;
  storageBucket: string;
  storagePath: string;
  versionNo: number;
  previousVersionId: string | null;
  status: DocumentStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalEntityType =
  | "rfq"
  | "estimation"
  | "quotation"
  | "final_commercial_decision"
  | "boq"
  | "po";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Approval = {
  id: string;
  entityType: ApprovalEntityType;
  entityId: string;
  approvalStage: string;
  approverId: string;
  status: ApprovalStatus;
  approvedAt: string | null;
  comments: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type AuditAction = "insert" | "update" | "delete" | "status_change";

export type AuditLogEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  performedAt: string;
};

export type ItemCategory = {
  id: string;
  categoryName: string;
  sequenceNo: number;
  isActive: boolean;
};

export type PriceSourceType = {
  id: string;
  sourceName: string;
  isActive: boolean;
};

export type DocumentCategory = {
  id: string;
  categoryName: string;
  isActive: boolean;
};
