import { apiFetch } from "@/lib/api-client";
import type { CommercialDocument, DocumentStatus } from "@/types/commercial/shared";
import type { DocumentCategory } from "@/types/sites/document";

/**
 * Raw com_documents row exactly as returned by GET /documents
 * (src/repositories/document.repository.js#findByEntity does a plain
 * `SELECT * FROM com_documents`, no field transformation) —
 * src/database/migrations/010_documents_approvals_audit.sql.
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
type DocumentCategoryListResponse = { success: boolean; message: string; data: DocumentCategory[] };
type SignedUrlResponse = { success: boolean; message: string; data: { url: string; expiresInSeconds: number } };

/**
 * Maps a raw com_documents row onto CommercialDocument
 * (@/types/commercial/shared), the type the existing shared DocumentsPanel
 * already renders — reusing that component/type rather than building a
 * parallel Client-specific one. Two fields need normalizing, not renaming:
 *   - status: DB/API uses PascalCase ('Active'/'Superseded'/'Archived',
 *     src/models/enums.js DOCUMENT_STATUS); CommercialDocument's
 *     DocumentStatus union (defined for the Commercial fixtures) is
 *     lowercase — DocumentStatusBadge's label/tone lookup is keyed by that
 *     lowercase union, so this lowercases to match it.
 *   - entityType: DocumentsPanel never reads this field, only stores it on
 *     the type. The real entity_type here is 'Client' (or 'ClientContact'/
 *     etc.), which isn't in DocumentEntityType's lowercase Commercial-only
 *     union ('rfq' | 'estimation' | ...) — cast rather than widen that
 *     shared union, since nothing renders off it.
 */
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
 * GET /documents?entityType=Client&entityId=<clientId> —
 * src/routes/document.routes.js:24, src/controllers/document.controller.js
 * #listByEntity. Real backend call, no fixture fallback (unlike Commercial's
 * still-fixture-backed lib/fixtures/documents.ts) — clm_client documents
 * have no seed data by design, so an empty result is a legitimate state.
 * Only entity_type='Client' rows are fetched: ClientContact/
 * ClientRequirement/ClientInvoice/ClientPayment documents would need those
 * submodules' real IDs, which don't exist yet (out of scope here).
 */
export async function getClientDocuments(clientId: string): Promise<CommercialDocument[]> {
  const response = await apiFetch<DocumentListResponse>(
    `/documents?entityType=Client&entityId=${encodeURIComponent(clientId)}`,
  );
  return response.data.map(toCommercialDocument);
}

/** GET /lookups/document-categories — src/routes/lookup.routes.js:37. Seeded lookup data only. */
export async function getDocumentCategoryOptions(): Promise<DocumentCategory[]> {
  const response = await apiFetch<DocumentCategoryListResponse>("/lookups/document-categories");
  return response.data;
}

/**
 * POST /documents (multipart/form-data) — src/routes/document.routes.js:25,
 * src/controllers/document.controller.js#upload ->
 * src/services/document.service.js#upload (real Supabase Storage write,
 * private bucket, architecture Phase 12). No requireRole gate on this route,
 * matching the backend as written.
 */
export async function uploadClientDocument(
  clientId: string,
  input: { file: File; documentCategoryId: string; description?: string },
): Promise<CommercialDocument> {
  const formData = new FormData();
  formData.append("entityType", "Client");
  formData.append("entityId", clientId);
  formData.append("documentCategoryId", input.documentCategoryId);
  if (input.description) formData.append("description", input.description);
  formData.append("file", input.file);

  const response = await apiFetch<DocumentResponse>("/documents", {
    method: "POST",
    body: formData,
  });
  return toCommercialDocument(response.data);
}

/**
 * GET /documents/:id/signed-url — src/routes/document.routes.js:27. Private
 * bucket, time-limited signed URL (never a public bucket URL, architecture
 * Phase 12).
 */
export async function getClientDocumentDownloadUrl(documentId: string): Promise<string> {
  const response = await apiFetch<SignedUrlResponse>(`/documents/${documentId}/signed-url`);
  return response.data.url;
}
