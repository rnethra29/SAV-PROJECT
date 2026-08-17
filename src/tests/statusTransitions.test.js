'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  RFQ_TRANSITIONS,
  ESTIMATION_TRANSITIONS,
  QUOTATION_TRANSITIONS,
  BOQ_TRANSITIONS,
  PO_TRANSITIONS,
  CLM_CLIENT_TRANSITIONS,
  CLM_REQUIREMENT_TRANSITIONS,
  CLM_INVOICE_TRANSITIONS,
  CLM_PAYMENT_VERIFICATION_TRANSITIONS,
  CLM_PROJECT_TRANSITIONS,
  VND_VENDOR_TRANSITIONS,
  VND_PO_TRANSITIONS,
  VND_PO_APPROVAL_STATUS_TRANSITIONS,
  VND_INVOICE_TRANSITIONS,
  VND_PAYMENT_TRANSITIONS,
  isValidTransition,
} = require('../models/statusTransitions');

describe('isValidTransition', () => {
  test('a status is always a valid "transition" into itself (idempotent update)', () => {
    assert.equal(isValidTransition(RFQ_TRANSITIONS, 'Draft', 'Draft'), true);
    assert.equal(isValidTransition(BOQ_TRANSITIONS, 'Final', 'Final'), true);
  });

  test('an unlisted target status is rejected', () => {
    assert.equal(isValidTransition(RFQ_TRANSITIONS, 'Draft', 'Won'), false);
  });

  test('terminal statuses (empty transition list) reject every onward move', () => {
    for (const terminal of ['Won', 'Lost', 'Cancelled', 'Expired']) {
      assert.deepEqual(RFQ_TRANSITIONS[terminal], []);
      assert.equal(isValidTransition(RFQ_TRANSITIONS, terminal, 'Draft'), false);
    }
  });
});

describe('RFQ status machine (architecture Phase 1.1 workflow order)', () => {
  test('happy path: Draft -> Received -> Under Review -> Under Estimation -> Quotation Prepared -> Submitted -> Won', () => {
    const path = ['Draft', 'Received', 'Under Review', 'Under Estimation', 'Quotation Prepared', 'Submitted', 'Won'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(RFQ_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
  });

  test('cannot skip straight from Draft to Negotiation', () => {
    assert.equal(isValidTransition(RFQ_TRANSITIONS, 'Draft', 'Negotiation'), false);
  });
});

describe('Estimation status machine', () => {
  test('Rejected can go back to In Progress for rework, or straight to Revised', () => {
    assert.equal(isValidTransition(ESTIMATION_TRANSITIONS, 'Rejected', 'In Progress'), true);
    assert.equal(isValidTransition(ESTIMATION_TRANSITIONS, 'Rejected', 'Revised'), true);
  });

  test('Draft cannot jump straight to Approved without going through the pipeline', () => {
    assert.equal(isValidTransition(ESTIMATION_TRANSITIONS, 'Draft', 'Approved'), false);
  });
});

describe('Quotation status machine', () => {
  test('Accepted is terminal', () => {
    assert.deepEqual(QUOTATION_TRANSITIONS.Accepted, []);
  });

  test('Rejected can be revised (-> new version flow)', () => {
    assert.equal(isValidTransition(QUOTATION_TRANSITIONS, 'Rejected', 'Revised'), true);
  });
});

describe('BOQ status machine (Tentative -> Final progression)', () => {
  test('Approved -> Final is allowed', () => {
    assert.equal(isValidTransition(BOQ_TRANSITIONS, 'Approved', 'Final'), true);
  });

  test('Draft cannot jump straight to Final', () => {
    assert.equal(isValidTransition(BOQ_TRANSITIONS, 'Draft', 'Final'), false);
  });
});

describe('PO status machine', () => {
  test('full happy path Draft -> Under Approval -> Approved -> Issued -> Acknowledged -> Closed', () => {
    const path = ['Draft', 'Under Approval', 'Approved', 'Issued', 'Acknowledged', 'Closed'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(PO_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
  });

  test('Closed and Cancelled are terminal', () => {
    assert.deepEqual(PO_TRANSITIONS.Closed, []);
    assert.deepEqual(PO_TRANSITIONS.Cancelled, []);
  });
});

describe('Client Management submodule status machines (Sites module)', () => {
  test('client: Prospect -> Active -> Inactive -> Active is a valid round trip; Blacklisted is terminal', () => {
    assert.equal(isValidTransition(CLM_CLIENT_TRANSITIONS, 'Prospect', 'Active'), true);
    assert.equal(isValidTransition(CLM_CLIENT_TRANSITIONS, 'Active', 'Inactive'), true);
    assert.equal(isValidTransition(CLM_CLIENT_TRANSITIONS, 'Inactive', 'Active'), true);
    assert.deepEqual(CLM_CLIENT_TRANSITIONS.Blacklisted, []);
  });

  test('requirement: happy path New -> Under Review -> Converted to RFQ -> Under Estimation -> Quoted -> Won', () => {
    const path = ['New', 'Under Review', 'Converted to RFQ', 'Under Estimation', 'Quoted', 'Won'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(CLM_REQUIREMENT_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
    assert.deepEqual(CLM_REQUIREMENT_TRANSITIONS.Won, []);
  });

  test('requirement: cannot skip straight from New to Quoted', () => {
    assert.equal(isValidTransition(CLM_REQUIREMENT_TRANSITIONS, 'New', 'Quoted'), false);
  });

  test('invoice: Draft -> Submitted -> Approved -> Partially Paid -> Paid is valid; Paid/Cancelled are terminal', () => {
    const path = ['Draft', 'Submitted', 'Approved', 'Partially Paid', 'Paid'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(CLM_INVOICE_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
    assert.deepEqual(CLM_INVOICE_TRANSITIONS.Paid, []);
    assert.deepEqual(CLM_INVOICE_TRANSITIONS.Cancelled, []);
  });

  test('invoice: cannot skip straight from Draft to Approved (must pass through Submitted)', () => {
    assert.equal(isValidTransition(CLM_INVOICE_TRANSITIONS, 'Draft', 'Approved'), false);
  });

  test('payment verification: Pending -> Verified/Rejected only, both terminal', () => {
    assert.equal(isValidTransition(CLM_PAYMENT_VERIFICATION_TRANSITIONS, 'Pending', 'Verified'), true);
    assert.equal(isValidTransition(CLM_PAYMENT_VERIFICATION_TRANSITIONS, 'Pending', 'Rejected'), true);
    assert.deepEqual(CLM_PAYMENT_VERIFICATION_TRANSITIONS.Verified, []);
    assert.deepEqual(CLM_PAYMENT_VERIFICATION_TRANSITIONS.Rejected, []);
  });
});

describe('Vendor Management & Procurement submodule status machines (Sites module)', () => {
  test('project: happy path Planning -> Estimation -> Approved -> In Progress -> On Hold -> In Progress -> Completed', () => {
    const path = ['Planning', 'Estimation', 'Approved', 'In Progress', 'On Hold', 'In Progress', 'Completed'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(CLM_PROJECT_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
    assert.deepEqual(CLM_PROJECT_TRANSITIONS.Completed, []);
  });

  test('project: cannot skip straight from Planning to In Progress', () => {
    assert.equal(isValidTransition(CLM_PROJECT_TRANSITIONS, 'Planning', 'In Progress'), false);
  });

  test('vendor: Active <-> Inactive/Under Review round trips; Blacklisted is terminal', () => {
    assert.equal(isValidTransition(VND_VENDOR_TRANSITIONS, 'Active', 'Under Review'), true);
    assert.equal(isValidTransition(VND_VENDOR_TRANSITIONS, 'Under Review', 'Active'), true);
    assert.equal(isValidTransition(VND_VENDOR_TRANSITIONS, 'Inactive', 'Active'), true);
    assert.deepEqual(VND_VENDOR_TRANSITIONS.Blacklisted, []);
  });

  test('procurement PO: happy path Draft -> Pending Approval -> Approved -> Sent to Vendor -> Partially Received -> Received -> Closed', () => {
    const path = ['Draft', 'Pending Approval', 'Approved', 'Sent to Vendor', 'Partially Received', 'Received', 'Closed'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(VND_PO_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
    assert.deepEqual(VND_PO_TRANSITIONS.Closed, []);
  });

  test('procurement PO: cannot skip straight from Draft to Approved', () => {
    assert.equal(isValidTransition(VND_PO_TRANSITIONS, 'Draft', 'Approved'), false);
  });

  test('procurement PO approval_status: Manager stage must precede Finance stage', () => {
    assert.equal(isValidTransition(VND_PO_APPROVAL_STATUS_TRANSITIONS, 'Pending', 'Manager Approved'), true);
    assert.equal(isValidTransition(VND_PO_APPROVAL_STATUS_TRANSITIONS, 'Manager Approved', 'Finance Approved'), true);
    assert.equal(isValidTransition(VND_PO_APPROVAL_STATUS_TRANSITIONS, 'Pending', 'Finance Approved'), false);
    assert.deepEqual(VND_PO_APPROVAL_STATUS_TRANSITIONS['Finance Approved'], []);
  });

  test('vendor invoice: happy path Draft -> Submitted -> Verified -> Approved -> Paid', () => {
    const path = ['Draft', 'Submitted', 'Verified', 'Approved', 'Paid'];
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(isValidTransition(VND_INVOICE_TRANSITIONS, path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
    }
    assert.deepEqual(VND_INVOICE_TRANSITIONS.Paid, []);
  });

  test('vendor invoice: a Disputed invoice can be resubmitted', () => {
    assert.equal(isValidTransition(VND_INVOICE_TRANSITIONS, 'Disputed', 'Submitted'), true);
  });

  test('vendor payment: Pending -> Processed -> Reversed is valid; a Failed payment can retry to Pending', () => {
    assert.equal(isValidTransition(VND_PAYMENT_TRANSITIONS, 'Pending', 'Processed'), true);
    assert.equal(isValidTransition(VND_PAYMENT_TRANSITIONS, 'Processed', 'Reversed'), true);
    assert.equal(isValidTransition(VND_PAYMENT_TRANSITIONS, 'Failed', 'Pending'), true);
    assert.deepEqual(VND_PAYMENT_TRANSITIONS.Reversed, []);
  });
});
