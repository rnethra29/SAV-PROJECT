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

const DOCUMENT_ENTITY_TYPE = Object.freeze([
  'RFQ', 'Estimation', 'Quotation', 'Negotiation', 'ClientOffer', 'BOQ', 'PO',
]);

const DOCUMENT_STATUS = Object.freeze(['Active', 'Superseded', 'Archived']);

const APPROVAL_ENTITY_TYPE = Object.freeze([
  'RFQ', 'Estimation', 'Quotation', 'FinalCommercialDecision', 'BOQ', 'PO',
]);

const APPROVAL_STATUS = Object.freeze(['Pending', 'Approved', 'Rejected']);

const AUDIT_ACTION = Object.freeze(['Insert', 'Update', 'Delete', 'StatusChange']);

/**
 * Business roles (architecture Phase 1.2 "Actors"). These are the values
 * expected in the `role` custom claim on the Supabase Auth JWT
 * (see auth.middleware.js). ADMIN is a superset role honored everywhere.
 */
const ROLES = Object.freeze({
  ADMIN: 'Admin',
  ESTIMATION_ENGINEER: 'Estimation Engineer',
  COMMERCIAL_COSTING_TEAM: 'Commercial/Costing Team',
  SALES_COMMERCIAL_MANAGER: 'Sales/Commercial Manager',
  APPROVER: 'Approver',
  PROCUREMENT_TEAM: 'Project/Procurement Team',
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
  ROLES,
};
