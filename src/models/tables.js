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

  // ---- Sites module -> Client Management submodule (clm_*, architecture
  // doc SAV_ERP_Client_Management_Module_Architecture.md §5/§9) ----
  CLM_CLIENT_TYPE: { name: 'clm_client_type', pk: 'client_type_id', pattern: 'LOOKUP_MINIMAL' },
  CLM_INDUSTRY: { name: 'clm_industry', pk: 'industry_id', pattern: 'LOOKUP_MINIMAL' },
  CLM_CONTACT_TYPE: { name: 'clm_contact_type', pk: 'contact_type_id', pattern: 'LOOKUP_MINIMAL' },
  CLM_CLIENT: { name: 'clm_client', pk: 'client_id', pattern: 'CORE' },
  CLM_CLIENT_CONTACT: { name: 'clm_client_contact', pk: 'contact_id', pattern: 'CORE' },
  CLM_CLIENT_REQUIREMENT: { name: 'clm_client_requirement', pk: 'requirement_id', pattern: 'CORE' },
  CLM_CLIENT_INVOICE: { name: 'clm_client_invoice', pk: 'invoice_id', pattern: 'CORE' },
  CLM_CLIENT_INVOICE_LINE: { name: 'clm_client_invoice_line', pk: 'invoice_line_id', pattern: 'CORE' },
  CLM_PAYMENT: { name: 'clm_payment', pk: 'payment_id', pattern: 'CORE' },
  CLM_PAYMENT_ALLOCATION: { name: 'clm_payment_allocation', pk: 'allocation_id', pattern: 'APPEND_ONLY' },
  CLM_CLIENT_STATUS_HISTORY: { name: 'clm_client_status_history', pk: 'status_history_id', pattern: 'APPEND_ONLY', timeCol: 'changed_at', byCol: 'changed_by' },
});

const VIEWS = Object.freeze({
  ITEM_COMMERCIAL_ANALYSIS: 'v_item_commercial_analysis',
  ESTIMATION_ITEM_COST: 'v_estimation_item_cost',

  // Client Management submodule views (doc §11/§13)
  CLIENT_360_OVERVIEW: 'v_client_360_overview',
  CLIENT_PROJECT_SUMMARY: 'v_client_project_summary',
  CLIENT_RFQ_HISTORY: 'v_client_rfq_history',
  CLIENT_BOQ_SUMMARY: 'v_client_boq_summary',
  CLIENT_PO_SUMMARY: 'v_client_po_summary',
  CLIENT_BILLING_SUMMARY: 'v_client_billing_summary',
  CLIENT_PAYMENT_SUMMARY: 'v_client_payment_summary',
  CLIENT_OUTSTANDING: 'v_client_outstanding',
  CLIENT_FINANCIAL_SUMMARY: 'v_client_financial_summary',
  CLIENT_DOCUMENTS: 'v_client_documents',
  CLIENT_ACTIVITY_HISTORY: 'v_client_activity_history',
  CLIENT_COST_UTILIZATION: 'v_client_cost_utilization',
  CLIENT_PROFIT_ANALYSIS: 'v_client_profit_analysis',
});

module.exports = { TABLES, VIEWS };
