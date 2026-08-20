import { apiFetch } from "@/lib/api-client";
import type { CommercialDocument, DocumentStatus } from "@/types/commercial/shared";

/**
 * Raw com_documents row exactly as returned by GET /documents, same shape
 * as client-documents-api.ts's RawDocument — one shared polymorphic table
 * (architecture doc §12), entity_type='ProcurementPO' here instead of
 * 'Client' (the full entity_type list added for this module: Project,
 * Vendor, VendorContact, ProcurementPO, VendorInvoice, VendorPayment).
 */
type RawDocument = {
  document_id: string;
  entity_type: string;
  entity_id: string;
  document_category_id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  version_no: number;
  previous_version_id: string | null;
  status: "Active" | "Superseded" | "Archived";
  description: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentListResponse = { success: boolean; message: string; data: RawDocument[] };
type DocumentResponse = { success: boolean; message: string; data: RawDocument };
type SignedUrlResponse = { success: boolean; message: string; data: { url: string; expiresInSeconds: number } };

/** Same mapping as client-documents-api.ts#toCommercialDocument — reuses the existing shared DocumentsPanel/CommercialDocument type rather than a parallel Procurement-specific one. */
function toCommercialDocument(raw: RawDocument): CommercialDocument {
  return {
    id: raw.document_id,
    entityType: raw.entity_type as CommercialDocument["entityType"],
    entityId: raw.entity_id,
    documentCategoryId: raw.document_category_id,
    fileName: raw.file_name,
    fileType: raw.file_type,
    mimeType: raw.mime_type,
    fileSizeBytes: raw.file_size_bytes,
    storageBucket: raw.storage_bucket,
    storagePath: raw.storage_path,
    versionNo: raw.version_no,
    previousVersionId: raw.previous_version_id,
    status: raw.status.toLowerCase() as DocumentStatus,
    description: raw.description,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * GET /documents?entityType=ProcurementPO&entityId=<poId> —
 * src/routes/document.routes.js, same shared endpoint client-documents-api.ts
 * uses. Real backend call, no fixture fallback: a PO with no documents yet
 * is a legitimate, expected state.
 */
export async function getProcurementOrderDocuments(poId: string): Promise<CommercialDocument[]> {
  const response = await apiFetch<DocumentListResponse>(
    `/documents?entityType=ProcurementPO&entityId=${encodeURIComponent(poId)}`,
  );
  return response.data.map(toCommercialDocument);
}

/**
 * POST /documents (multipart/form-data) — same shared upload endpoint,
 * entityType='ProcurementPO'.
 */
export async function uploadProcurementOrderDocument(
  poId: string,
  input: { file: File; documentCategoryId: string; description?: string },
): Promise<CommercialDocument> {
  const formData = new FormData();
  formData.append("entityType", "ProcurementPO");
  formData.append("entityId", poId);
  formData.append("documentCategoryId", input.documentCategoryId);
  if (input.description) formData.append("description", input.description);
  formData.append("file", input.file);

  const response = await apiFetch<DocumentResponse>("/documents", {
    method: "POST",
    body: formData,
  });
  return toCommercialDocument(response.data);
}

/** GET /documents/:id/signed-url — private bucket, time-limited signed URL (architecture Phase 12). */
export async function getProcurementOrderDocumentDownloadUrl(documentId: string): Promise<string> {
  const response = await apiFetch<SignedUrlResponse>(`/documents/${documentId}/signed-url`);
  return response.data.url;
}
