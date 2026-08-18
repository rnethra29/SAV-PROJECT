/**
 * com_document_category lookup row, per
 * src/database/migrations/003_lookup_tables.sql. Shared across every
 * document-entity type (RFQ, BOQ, Client, ...) — not Client Management-
 * specific, but modeled here since this is the first Sites-side consumer.
 */
export type DocumentCategory = {
  document_category_id: string;
  category_name: string;
  is_active: boolean;
};
