export type RfqStatus =
  | "draft"
  | "received"
  | "under_review"
  | "under_estimation"
  | "quotation_prepared"
  | "submitted"
  | "negotiation"
  | "won"
  | "lost"
  | "cancelled"
  | "expired";

export type RfqItem = {
  id: string;
  rfqId: string;
  parentItemId: string | null;
  itemCode: string;
  categoryId: string | null;
  description: string;
  unit: string;
  quantity: number;
  sequenceNo: number;
  remarks: string | null;
};

export type Rfq = {
  id: string;
  rfqNumber: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  siteId: string | null;
  rfqDate: string;
  scopeOfWork: string | null;
  executionTimeline: string | null;
  paymentTerms: string | null;
  status: RfqStatus;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};
