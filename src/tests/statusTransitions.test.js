'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  RFQ_TRANSITIONS,
  ESTIMATION_TRANSITIONS,
  QUOTATION_TRANSITIONS,
  BOQ_TRANSITIONS,
  PO_TRANSITIONS,
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
