export type BoqType = "tentative" | "final";

export type BoqStatus = "draft" | "tentative" | "under_review" | "approved" | "final" | "revised" | "cancelled";

export type Boq = {
  id: string;
  boqNumber: string;
  versionNo: number;
  previousVersionId: string | null;
  boqTitle: string;
  projectId: string;
  clientId: string;
  siteId: string | null;
  rfqId: string;
  quotationId: string | null;
  boqType: BoqType;
  status: BoqStatus;
  revisionReason: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BoqItem = {
  id: string;
  boqId: string;
  parentItemId: string | null;
  categoryId: string | null;
  itemCode: string;
  // Word-count capped at 50 (com_fn_word_count rule) — enforced at the form
  // layer, not just displayed.
  description: string;
  descriptionWordCount: number;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  sequenceNo: number;
  sourceRfqItemId: string | null;
  sourceQuotationItemId: string | null;
  remarks: string | null;
};
