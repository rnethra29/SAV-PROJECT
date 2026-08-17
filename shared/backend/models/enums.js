'use strict';

/**
 * JS mirrors of every Postgres ENUM type created in
 * src/database/migrations/001_extensions_and_enums.sql
 * (architecture doc Phase 11). Keep these two in sync by hand - there is
 * no runtime introspection of pg_enum, deliberately, so validators can
 * stay synchronous and dependency-free.
 */

const RFQ_STATUS = Object.freeze([
  'Draft', 'Received', 'Under Review', 'Under Estimation', 'Quotation Prepared',
  'Submitted', 'Negotiation', 'Won', 'Lost', 'Cancelled', 'Expired',
]);

const ESTIMATION_STATUS = Object.freeze([
  'Draft', 'In Progress', 'Submitted for Approval', 'Approved', 'Rejected', 'Revised',
]);

const QUOTATION_STATUS = Object.freeze([
  'Draft', 'Under Approval', 'Approved', 'Submitted', 'Revised', 'Accepted', 'Rejected', 'Expired', 'Cancelled',
]);

const BOQ_TYPE = Object.freeze(['Tentative', 'Final']);

const BOQ_STATUS = Object.freeze([
  'Draft', 'Tentative', 'Under Review', 'Approved', 'Final', 'Revised', 'Cancelled',
]);

const PO_STATUS = Object.freeze([
  'Draft', 'Under Approval', 'Approved', 'Issued', 'Acknowledged', 'Cancelled', 'Closed',
]);

const PRICE_BASIS = Object.freeze([
  'Current Market', 'Vendor Price', 'Internal Purchase', 'Historical Project', 'Approved Estimation Rate', 'Other',
]);

const OFFER_TYPE = Object.freeze(['SAV_Quote', 'Client_Offer', 'SAV_Counter', 'Client_Counter', 'Final']);

const OFFER_PARTY = Object.freeze(['SAV', 'Client']);

const OFFER_RESPONSE_STATUS = Object.freeze(['Pending', 'Accepted', 'Rejected', 'Countered']);

// 'Client'/'ClientContact'/'ClientRequirement'/'ClientInvoice'/'ClientPayment' added
// by the Sites module's Client Management submodule (012_clm_extensions_and_enums.sql,
// ALTER TYPE com_document_entity_type ADD VALUE) - com_documents is reused, not duplicated.
// 'Project'/'Vendor'/'VendorContact'/'ProcurementPO'/'VendorInvoice'/'VendorPayment' added
// by the Vendor Management & Procurement submodule (020_vnd_extensions_and_enums.sql).
const DOCUMENT_ENTITY_TYPE = Object.freeze([
  'RFQ', 'Estimation', 'Quotation', 'Negotiation', 'ClientOffer', 'BOQ', 'PO',
  'Client', 'ClientContact', 'ClientRequirement', 'ClientInvoice', 'ClientPayment',
  'Project', 'Vendor', 'VendorContact', 'ProcurementPO', 'VendorInvoice', 'VendorPayment',
]);

const DOCUMENT_STATUS = Object.freeze(['Active', 'Superseded', 'Archived']);

// 'ClientInvoice' added by the Client Management submodule; 'ProcurementPO'/
// 'VendorInvoice'/'VendorPayment' added by the Vendor Management & Procurement
// submodule (both via ALTER TYPE com_approval_entity_type ADD VALUE) -
// com_approvals is reused, not duplicated.
const APPROVAL_ENTITY_TYPE = Object.freeze([
  'RFQ', 'Estimation', 'Quotation', 'FinalCommercialDecision', 'BOQ', 'PO', 'ClientInvoice',
  'ProcurementPO', 'VendorInvoice', 'VendorPayment',
]);

const APPROVAL_STATUS = Object.freeze(['Pending', 'Approved', 'Rejected']);

// 'Approve'/'Reject'/'Submit'/'Cancel'/'Payment'/'Upload'/'Download' added by
// the Vendor Management & Procurement submodule (ALTER TYPE com_audit_action ADD VALUE).
const AUDIT_ACTION = Object.freeze([
  'Insert', 'Update', 'Delete', 'StatusChange',
  'Approve', 'Reject', 'Submit', 'Cancel', 'Payment', 'Upload', 'Download',
]);

/**
 * Client Management submodule ENUM mirrors (Sites module - see
 * src/database/migrations/012_clm_extensions_and_enums.sql).
 */
const CLM_CLIENT_STATUS = Object.freeze(['Prospect', 'Active', 'Inactive', 'Blacklisted']);

const CLM_REQUIREMENT_PRIORITY = Object.freeze(['Low', 'Medium', 'High', 'Urgent']);

const CLM_REQUIREMENT_STATUS = Object.freeze([
  'New', 'Under Review', 'Converted to RFQ', 'Under Estimation', 'Quoted', 'Won', 'Lost', 'Cancelled',
]);

const CLM_INVOICE_STATUS = Object.freeze([
  'Draft', 'Submitted', 'Approved', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled',
]);

const CLM_PAYMENT_METHOD = Object.freeze(['Bank Transfer', 'Cheque', 'DD', 'UPI', 'Other']);

const CLM_VERIFICATION_STATUS = Object.freeze(['Pending', 'Verified', 'Rejected']);

const CLM_STATUS_ENTITY_TYPE = Object.freeze(['ClientRequirement', 'ClientInvoice']);

/**
 * Vendor Management & Procurement submodule ENUM mirrors, plus the
 * `clm_project*` extension to Client Management (Sites module - see
 * src/database/migrations/020_vnd_extensions_and_enums.sql).
 */
const CLM_PROJECT_STATUS = Object.freeze([
  'Planning', 'Estimation', 'Approved', 'In Progress', 'On Hold', 'Completed', 'Cancelled',
]);

const CLM_COST_CATEGORY = Object.freeze([
  'Material', 'Labour', 'Equipment', 'Transportation', 'Subcontractor', 'Overhead', 'Contingency', 'Other',
]);

const CLM_EXPENSE_PAYMENT_STATUS = Object.freeze(['Unpaid', 'Partially Paid', 'Paid']);

const CLM_APPROVAL_STATUS_SIMPLE = Object.freeze(['Pending', 'Approved', 'Rejected']);

const VND_VENDOR_STATUS = Object.freeze(['Active', 'Inactive', 'Blacklisted', 'Under Review']);

const VND_PO_STATUS = Object.freeze([
  'Draft', 'Pending Approval', 'Approved', 'Sent to Vendor', 'Partially Received', 'Received', 'Closed', 'Cancelled',
]);

const VND_APPROVAL_STATUS = Object.freeze(['Not Required', 'Pending', 'Manager Approved', 'Finance Approved', 'Rejected']);

const VND_INVOICE_STATUS = Object.freeze([
  'Draft', 'Submitted', 'Verified', 'Approved', 'Partially Paid', 'Paid', 'Disputed', 'Cancelled',
]);

const VND_PAYMENT_METHOD = Object.freeze(['Bank Transfer', 'Cheque', 'UPI', 'Cash', 'Other']);

const VND_PAYMENT_STATUS = Object.freeze(['Pending', 'Processed', 'Failed', 'Reversed']);

/**
 * Business roles (architecture Phase 1.2 "Actors"). These are the values
 * expected in the `role` custom claim on the Supabase Auth JWT
 * (see auth.middleware.js). ADMIN is a superset role honored everywhere.
 * FINANCE_ACCOUNTS_TEAM is introduced by the Client Management submodule
 * (billing/payments - see its architecture doc §15 Security). PROJECT_MANAGER
 * through VIEWER are introduced by the Vendor Management & Procurement
 * submodule's own Actor list (its architecture doc §1.2/§14) - kept distinct
 * from the pre-existing, coarser-grained roles above rather than overloading
 * them, since the two submodules' approval-stage gates (Manager vs Finance)
 * need to tell these actors apart.
 */
const ROLES = Object.freeze({
  ADMIN: 'Admin',
  ESTIMATION_ENGINEER: 'Estimation Engineer',
  COMMERCIAL_COSTING_TEAM: 'Commercial/Costing Team',
  SALES_COMMERCIAL_MANAGER: 'Sales/Commercial Manager',
  APPROVER: 'Approver',
  PROCUREMENT_TEAM: 'Project/Procurement Team',
  FINANCE_ACCOUNTS_TEAM: 'Finance/Accounts Team',
  PROJECT_MANAGER: 'Project Manager',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  PROCUREMENT_MANAGER: 'Procurement Manager',
  SITE_ENGINEER: 'Site Engineer',
  ACCOUNTANT: 'Accountant',
  FINANCE_MANAGER: 'Finance Manager',
  MANAGEMENT: 'Management',
  VIEWER: 'Viewer',
});

module.exports = {
  RFQ_STATUS,
  ESTIMATION_STATUS,
  QUOTATION_STATUS,
  BOQ_TYPE,
  BOQ_STATUS,
  PO_STATUS,
  PRICE_BASIS,
  OFFER_TYPE,
  OFFER_PARTY,
  OFFER_RESPONSE_STATUS,
  DOCUMENT_ENTITY_TYPE,
  DOCUMENT_STATUS,
  APPROVAL_ENTITY_TYPE,
  APPROVAL_STATUS,
  AUDIT_ACTION,
  CLM_CLIENT_STATUS,
  CLM_REQUIREMENT_PRIORITY,
  CLM_REQUIREMENT_STATUS,
  CLM_INVOICE_STATUS,
  CLM_PAYMENT_METHOD,
  CLM_VERIFICATION_STATUS,
  CLM_STATUS_ENTITY_TYPE,
  CLM_PROJECT_STATUS,
  CLM_COST_CATEGORY,
  CLM_EXPENSE_PAYMENT_STATUS,
  CLM_APPROVAL_STATUS_SIMPLE,
  VND_VENDOR_STATUS,
  VND_PO_STATUS,
  VND_APPROVAL_STATUS,
  VND_INVOICE_STATUS,
  VND_PAYMENT_METHOD,
  VND_PAYMENT_STATUS,
  ROLES,
};
