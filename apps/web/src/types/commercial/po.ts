export type PoStatus = "draft" | "under_approval" | "approved" | "issued" | "acknowledged" | "cancelled" | "closed";

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  poDate: string;
  vendorId: string;
  vendorName: string;
  projectId: string;
  siteId: string | null;
  boqId: string | null;
  quotationId: string | null;
  rfqId: string | null;
  paymentTerms: string | null;
  deliveryTimeline: string | null;
  termsAndConditions: string | null;
  status: PoStatus;
  subtotalAmount: number | null;
  taxAmount: number;
  totalAmount: number | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PoItem = {
  id: string;
  poId: string;
  boqItemId: string | null;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  taxPercentage: number;
  amount: number;
  sequenceNo: number;
  remarks: string | null;
};
