export type QuotationStatus =
  | "draft"
  | "under_approval"
  | "approved"
  | "submitted"
  | "revised"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export type Quotation = {
  id: string;
  rfqId: string;
  projectId: string;
  clientId: string;
  quotationNumber: string;
  versionNo: number;
  previousVersionId: string | null;
  quotationDate: string;
  validityDate: string | null;
  status: QuotationStatus;
  paymentTerms: string | null;
  executionPeriod: string | null;
  inclusions: string | null;
  exclusions: string | null;
  commercialTerms: string | null;
  subtotalAmount: number | null;
  taxAmount: number;
  totalAmount: number | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuotationItem = {
  id: string;
  quotationId: string;
  rfqItemId: string;
  estimationItemId: string | null;
  // Denormalized snapshot at this version — the item can keep its own
  // quantity/unit even if the RFQ item is edited after this version ships.
  itemCode: string;
  quantity: number;
  unit: string;
  quotedRate: number;
  quotedAmount: number;
  taxPercentage: number;
  remarks: string | null;
};
