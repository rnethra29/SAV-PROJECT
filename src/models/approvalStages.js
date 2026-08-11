'use strict';

/**
 * Canonical `approval_stage` labels used when gating a status transition on
 * a prior `com_approvals` decision (architecture Phase 8 rule #13: "entity
 * cannot progress past a gated status until an Approved row exists for that
 * stage"; Phase 1.2 lists the Approver's six gates in this exact order:
 * RFQ, Estimation, Quotation, Final Commercial Decision, BOQ, PO - matching
 * `com_approval_entity_type`).
 *
 * The architecture doc doesn't prescribe which specific status transition
 * each gate blocks - `approval.service.js`'s `isApproved()` is a reusable
 * primitive, and the mapping below (one call site per service) is this
 * implementation's reading of Phase 1.2/1.5: an entity may not be marked
 * as commercially "Approved"/"Final" without a matching sign-off on record.
 */
const APPROVAL_STAGES = Object.freeze({
  RFQ: 'RFQ Approval',
  ESTIMATION: 'Estimation Approval',
  QUOTATION: 'Quotation Approval',
  FINAL_COMMERCIAL_DECISION: 'Final Commercial Decision Approval',
  BOQ: 'BOQ Final Approval',
  PO: 'PO Approval',
});

module.exports = { APPROVAL_STAGES };
