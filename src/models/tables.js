'use strict';

/**
 * Table name + primary key constants (architecture Phase 4/5), grouped by
 * audit pattern so BaseRepository knows how to treat each one:
 *  - CORE: full audit set (created_* / updated_* / deleted_*) + company/branch scoping
 *  - LOOKUP: lighter audit set (created_* / updated_* only), no soft-delete, no branch scoping requirement
 *  - APPEND_ONLY: created_at/created_by (or changed_at/changed_by) only, never updated/deleted
 */

const TABLES = Object.freeze({
  RFQ: { name: 'com_rfq', pk: 'rfq_id', pattern: 'CORE' },
  RFQ_ITEMS: { name: 'com_rfq_items', pk: 'rfq_item_id', pattern: 'CORE' },
  ESTIMATION: { name: 'com_estimation', pk: 'estimation_id', pattern: 'CORE' },
  ESTIMATION_ITEMS: { name: 'com_estimation_items', pk: 'estimation_item_id', pattern: 'CORE' },
  MARKET_PRICE_REFERENCE: { name: 'com_market_price_reference', pk: 'market_price_id', pattern: 'APPEND_ONLY' },
  ACTUAL_PRICE: { name: 'com_actual_price', pk: 'actual_price_id', pattern: 'CORE_NO_SOFT_DELETE' },
  ACTUAL_PRICE_HISTORY: { name: 'com_actual_price_history', pk: 'actual_price_history_id', pattern: 'APPEND_ONLY', timeCol: 'changed_at', byCol: 'changed_by' },
  QUOTATION: { name: 'com_quotation', pk: 'quotation_id', pattern: 'CORE' },
  QUOTATION_ITEMS: { name: 'com_quotation_items', pk: 'quotation_item_id', pattern: 'CORE' },
  NEGOTIATION_OFFERS: { name: 'com_negotiation_offers', pk: 'offer_id', pattern: 'APPEND_ONLY' },
  BOQ: { name: 'com_boq', pk: 'boq_id', pattern: 'CORE' },
  BOQ_ITEMS: { name: 'com_boq_items', pk: 'boq_item_id', pattern: 'CORE' },
  PO: { name: 'com_po', pk: 'po_id', pattern: 'CORE' },
  PO_ITEMS: { name: 'com_po_items', pk: 'po_item_id', pattern: 'CORE' },
  DOCUMENTS: { name: 'com_documents', pk: 'document_id', pattern: 'CORE_NO_SOFT_DELETE' },
  APPROVALS: { name: 'com_approvals', pk: 'approval_id', pattern: 'APPEND_ONLY' },
  AUDIT_LOG: { name: 'com_audit_log', pk: 'audit_id', pattern: 'APPEND_ONLY', timeCol: 'performed_at', byCol: 'user_id' },
  ITEM_CATEGORY: { name: 'com_item_category', pk: 'category_id', pattern: 'LOOKUP' },
  PRICE_SOURCE_TYPE: { name: 'com_price_source_type', pk: 'source_type_id', pattern: 'LOOKUP_MINIMAL' },
  DOCUMENT_CATEGORY: { name: 'com_document_category', pk: 'document_category_id', pattern: 'LOOKUP_MINIMAL' },
});

const VIEWS = Object.freeze({
  ITEM_COMMERCIAL_ANALYSIS: 'v_item_commercial_analysis',
  ESTIMATION_ITEM_COST: 'v_estimation_item_cost',
});

module.exports = { TABLES, VIEWS };
