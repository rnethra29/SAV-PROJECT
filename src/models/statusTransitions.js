'use strict';

/**
 * App-layer status state machines (architecture Phase 8 rule #12: "DB ENUM
 * constrains the *set* of valid values, app logic constrains the
 * *sequence*"). Each map lists, per status, the statuses it may move to.
 * An empty array marks a terminal status. Not specified verbatim in the
 * architecture doc (which only enumerates the value sets, Phase 5/11) -
 * derived from the workflow narrative in Phase 1.1/1.5 and the natural
 * reading of each enum's ordering.
 */

const RFQ_TRANSITIONS = {
  Draft: ['Received', 'Cancelled'],
  Received: ['Under Review', 'Cancelled'],
  'Under Review': ['Under Estimation', 'Cancelled'],
  'Under Estimation': ['Quotation Prepared', 'Cancelled'],
  'Quotation Prepared': ['Submitted', 'Cancelled'],
  Submitted: ['Negotiation', 'Won', 'Lost', 'Cancelled', 'Expired'],
  Negotiation: ['Won', 'Lost', 'Cancelled', 'Expired'],
  Won: [],
  Lost: [],
  Cancelled: [],
  Expired: [],
};

const ESTIMATION_TRANSITIONS = {
  Draft: ['In Progress'],
  'In Progress': ['Submitted for Approval'],
  'Submitted for Approval': ['Approved', 'Rejected'],
  Approved: ['Revised'],
  Rejected: ['Revised', 'In Progress'],
  Revised: ['Submitted for Approval'],
};

const QUOTATION_TRANSITIONS = {
  Draft: ['Under Approval', 'Cancelled'],
  'Under Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Submitted', 'Cancelled'],
  Submitted: ['Revised', 'Accepted', 'Rejected', 'Expired', 'Cancelled'],
  Revised: ['Under Approval', 'Cancelled'],
  Accepted: [],
  Rejected: ['Revised'],
  Expired: ['Revised', 'Cancelled'],
  Cancelled: [],
};

const BOQ_TRANSITIONS = {
  Draft: ['Tentative', 'Cancelled'],
  Tentative: ['Under Review', 'Cancelled'],
  'Under Review': ['Approved', 'Revised', 'Cancelled'],
  Approved: ['Final', 'Revised'],
  Final: ['Revised'],
  Revised: ['Under Review'],
  Cancelled: [],
};

const PO_TRANSITIONS = {
  Draft: ['Under Approval', 'Cancelled'],
  'Under Approval': ['Approved', 'Cancelled'],
  Approved: ['Issued', 'Cancelled'],
  Issued: ['Acknowledged', 'Cancelled'],
  Acknowledged: ['Closed', 'Cancelled'],
  Closed: [],
  Cancelled: [],
};

/**
 * Client Management submodule (Sites module) state machines. Not specified
 * verbatim in that module's architecture doc either (which only enumerates
 * the ENUM value sets, doc §9/§6) - derived the same way as the maps above,
 * from the workflow narrative in doc §1/§17 and the natural reading of each
 * enum's ordering.
 */
const CLM_CLIENT_TRANSITIONS = {
  Prospect: ['Active', 'Inactive', 'Blacklisted'],
  Active: ['Inactive', 'Blacklisted'],
  Inactive: ['Active', 'Blacklisted'],
  Blacklisted: [],
};

const CLM_REQUIREMENT_TRANSITIONS = {
  New: ['Under Review', 'Cancelled'],
  'Under Review': ['Converted to RFQ', 'Cancelled'],
  'Converted to RFQ': ['Under Estimation', 'Cancelled'],
  'Under Estimation': ['Quoted', 'Cancelled'],
  Quoted: ['Won', 'Lost', 'Cancelled'],
  Won: [],
  Lost: [],
  Cancelled: [],
};

const CLM_INVOICE_TRANSITIONS = {
  Draft: ['Submitted', 'Cancelled'],
  Submitted: ['Approved', 'Cancelled'],
  Approved: ['Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  'Partially Paid': ['Paid', 'Overdue', 'Cancelled'],
  Overdue: ['Partially Paid', 'Paid', 'Cancelled'],
  Paid: [],
  Cancelled: [],
};

/** Payment verification is a one-shot decision (doc §15) - a rejected payment record is corrected via a new row, not reopened, consistent with the module's ledger-pattern convention. */
const CLM_PAYMENT_VERIFICATION_TRANSITIONS = {
  Pending: ['Verified', 'Rejected'],
  Verified: [],
  Rejected: [],
};

/**
 * @param {Record<string, string[]>} transitions
 * @param {string} from
 * @param {string} to
 */
function isValidTransition(transitions, from, to) {
  if (from === to) return true; // idempotent no-op update
  return Boolean(transitions[from] && transitions[from].includes(to));
}

module.exports = {
  RFQ_TRANSITIONS,
  ESTIMATION_TRANSITIONS,
  QUOTATION_TRANSITIONS,
  BOQ_TRANSITIONS,
  PO_TRANSITIONS,
  CLM_CLIENT_TRANSITIONS,
  CLM_REQUIREMENT_TRANSITIONS,
  CLM_INVOICE_TRANSITIONS,
  CLM_PAYMENT_VERIFICATION_TRANSITIONS,
  isValidTransition,
};
