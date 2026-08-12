import type { CommercialDocument, DocumentEntityType } from "@/types/commercial/shared";

/**
 * TEMPORARY FRONTEND FIXTURE — no Documents backend / Supabase Storage
 * integration exists yet. Replace with real apiFetch(`/documents?entityType=
 * ...&entityId=...`) calls once the Express com_documents endpoint and
 * Storage buckets exist. Per the architecture doc (Phase 12), documents are
 * never truly deleted from the UI's perspective — only superseded/archived —
 * so no delete action is offered here, only an upload affordance that is
 * intentionally disabled (no real storage backing it yet).
 */

const documentFixtures: CommercialDocument[] = [
  { id: "doc-rfq-0042-1", entityType: "rfq", entityId: "rfq-2026-0042", documentCategoryId: "dc-client-rfq", fileName: "Suzlon_RFQ_3.15MW_Foundation.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 2_458_112, storageBucket: "com-rfq-docs", storagePath: "rfq/rfq-2026-0042/doc-rfq-0042-1_Suzlon_RFQ_3.15MW_Foundation.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Original client RFQ document as received.", createdAt: "2026-01-15T09:35:00.000Z", updatedAt: "2026-01-15T09:35:00.000Z" },
  { id: "doc-rfq-0042-2", entityType: "rfq", entityId: "rfq-2026-0042", documentCategoryId: "dc-drawing", fileName: "Foundation_GA_Drawing_RevB.dwg", fileType: "dwg", mimeType: "application/octet-stream", fileSizeBytes: 5_120_400, storageBucket: "com-rfq-docs", storagePath: "rfq/rfq-2026-0042/doc-rfq-0042-2_Foundation_GA_Drawing_RevB.dwg", versionNo: 1, previousVersionId: null, status: "active", description: "General arrangement drawing attached to the RFQ.", createdAt: "2026-01-15T09:40:00.000Z", updatedAt: "2026-01-15T09:40:00.000Z" },
  { id: "doc-quo-0042-1", entityType: "quotation", entityId: "quo-0042-v2", documentCategoryId: "dc-quotation-out", fileName: "SAV_Quotation_QTN-2026-0042_v2.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 812_004, storageBucket: "com-quotation-docs", storagePath: "quotation/quo-0042-v2/doc-quo-0042-1_SAV_Quotation_QTN-2026-0042_v2.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Final quotation issued to client, version 2.", createdAt: "2026-02-10T16:10:00.000Z", updatedAt: "2026-02-10T16:10:00.000Z" },
  { id: "doc-boq-0042-1", entityType: "boq", entityId: "boq-0042-v2", documentCategoryId: "dc-boq", fileName: "Final_BOQ_2026-0042.xlsx", fileType: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSizeBytes: 145_220, storageBucket: "com-boq-docs", storagePath: "boq/boq-0042-v2/doc-boq-0042-1_Final_BOQ_2026-0042.xlsx", versionNo: 1, previousVersionId: null, status: "active", description: "Final BOQ export shared with procurement.", createdAt: "2026-02-15T09:10:00.000Z", updatedAt: "2026-02-15T09:10:00.000Z" },
  { id: "doc-po-0042-1", entityType: "po", entityId: "po-0042-01", documentCategoryId: "dc-po", fileName: "PO-2026-0042-01_ShreeEarthmovers.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 298_112, storageBucket: "com-po-docs", storagePath: "po/po-0042-01/doc-po-0042-1_PO-2026-0042-01_ShreeEarthmovers.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Issued purchase order document.", createdAt: "2026-02-20T10:05:00.000Z", updatedAt: "2026-02-20T10:05:00.000Z" },

  { id: "doc-rfq-0031-1", entityType: "rfq", entityId: "rfq-2026-0031", documentCategoryId: "dc-client-rfq", fileName: "OGP_RFQ_Substation_Works.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 1_845_002, storageBucket: "com-rfq-docs", storagePath: "rfq/rfq-2026-0031/doc-rfq-0031-1_OGP_RFQ_Substation_Works.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Original client RFQ document as received.", createdAt: "2025-11-02T10:05:00.000Z", updatedAt: "2025-11-02T10:05:00.000Z" },
  { id: "doc-rfq-0028-1", entityType: "rfq", entityId: "rfq-2026-0028", documentCategoryId: "dc-client-rfq", fileName: "Inox_RFQ_2MW_Foundation.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 1_602_884, storageBucket: "com-rfq-docs", storagePath: "rfq/rfq-2026-0028/doc-rfq-0028-1_Inox_RFQ_2MW_Foundation.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Original client RFQ document as received.", createdAt: "2025-09-20T08:20:00.000Z", updatedAt: "2025-09-20T08:20:00.000Z" },
  { id: "doc-rfq-0045-1", entityType: "rfq", entityId: "rfq-2026-0045", documentCategoryId: "dc-client-rfq", fileName: "OGP_RFQ_Site_Grading.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 940_112, storageBucket: "com-rfq-docs", storagePath: "rfq/rfq-2026-0045/doc-rfq-0045-1_OGP_RFQ_Site_Grading.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Original client RFQ document as received.", createdAt: "2026-01-25T09:05:00.000Z", updatedAt: "2026-01-25T09:05:00.000Z" },
  { id: "doc-rfq-0038-1", entityType: "rfq", entityId: "rfq-2026-0038", documentCategoryId: "dc-client-rfq", fileName: "Inox_RFQ_2MW_Phase2.pdf", fileType: "pdf", mimeType: "application/pdf", fileSizeBytes: 1_733_500, storageBucket: "com-rfq-docs", storagePath: "rfq/rfq-2026-0038/doc-rfq-0038-1_Inox_RFQ_2MW_Phase2.pdf", versionNo: 1, previousVersionId: null, status: "active", description: "Original client RFQ document as received.", createdAt: "2025-12-10T11:35:00.000Z", updatedAt: "2025-12-10T11:35:00.000Z" },
];

export async function getDocuments(entityType: DocumentEntityType, entityId: string): Promise<CommercialDocument[]> {
  return documentFixtures
    .filter((doc) => doc.entityType === entityType && doc.entityId === entityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
