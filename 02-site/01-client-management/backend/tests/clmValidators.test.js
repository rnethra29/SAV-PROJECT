'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { createClient } = require('../validators/clmClient.validator');
const { createClientRequirement } = require('../validators/clmClientRequirement.validator');
const { createClientInvoice } = require('../validators/clmClientInvoice.validator');
const { createInvoiceLineForInvoice } = require('../validators/clmClientInvoiceLine.validator');
const { createPayment, createAllocationForPayment } = require('../validators/clmPayment.validator');
const { createClientContactForClient } = require('../validators/clmClientContact.validator');

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

const validClientBase = {
  client_code: 'CLI-0042',
  legal_name: 'Jindal Industries Pvt Ltd',
  display_name: 'Jindal Industries',
  client_type_id: VALID_UUID,
  billing_address_line1: 'Plot 12, Industrial Estate',
  billing_city: 'Chennai',
  billing_state: 'Tamil Nadu',
  billing_pincode: '600001',
  primary_email: 'accounts@jindal.com',
  primary_phone: '9876543210',
};

describe('clmClient.validator (architecture doc §6.3)', () => {
  test('accepts a minimal valid client payload, defaulting billing_country and client_status', () => {
    const { error, value } = createClient.validate(validClientBase);
    assert.equal(error, undefined);
    assert.equal(value.billing_country, 'India');
    assert.equal(value.client_status, 'Prospect');
  });

  test('rejects a client missing required billing address fields', () => {
    const { billing_city, ...withoutCity } = validClientBase;
    const { error } = createClient.validate(withoutCity);
    assert.notEqual(error, undefined);
  });

  test('rejects an invalid client_status value', () => {
    const { error } = createClient.validate({ ...validClientBase, client_status: 'Deleted' });
    assert.notEqual(error, undefined);
  });
});

describe('clmClientContact.validator (one primary per contact_type is enforced in the service, not here - §6.4)', () => {
  test('accepts a valid contact, defaulting is_primary_contact to false', () => {
    const { error, value } = createClientContactForClient.validate({
      contact_name: 'Ravi Kumar',
      contact_type_id: VALID_UUID,
    });
    assert.equal(error, undefined);
    assert.equal(value.is_primary_contact, false);
  });
});

describe('clmClientRequirement.validator (§6.6)', () => {
  test('accepts a valid requirement, defaulting priority and status', () => {
    const { error, value } = createClientRequirement.validate({
      requirement_number: 'REQ-2026-0011',
      client_id: VALID_UUID,
      requirement_title: 'Foundation works for JSW plant expansion',
      received_date: '2026-01-15',
    });
    assert.equal(error, undefined);
    assert.equal(value.priority, 'Medium');
    assert.equal(value.requirement_status, 'New');
  });
});

describe('clmClientInvoice.validator (§6.7 - net_amount is DB-generated, never accepted)', () => {
  const validInvoice = {
    invoice_number: 'INV-2026-0201',
    client_id: VALID_UUID,
    project_id: VALID_UUID,
    invoice_date: '2026-02-01',
    gross_amount: 7500000,
  };

  test('accepts a valid invoice payload and strips a net_amount if one is somehow supplied', () => {
    const { error, value } = createClientInvoice.validate({ ...validInvoice, net_amount: 999 }, { stripUnknown: true });
    assert.equal(error, undefined);
    assert.equal(value.net_amount, undefined);
  });

  test('rejects a negative gross_amount', () => {
    const { error } = createClientInvoice.validate({ ...validInvoice, gross_amount: -1 });
    assert.notEqual(error, undefined);
  });
});

describe('clmClientInvoiceLine.validator (§6.8 - quantity/rate nullable for lump-sum lines)', () => {
  test('accepts a lump-sum line with no quantity/rate, only line_amount', () => {
    const { error } = createInvoiceLineForInvoice.validate({
      description: 'Mobilization advance (25% milestone)',
      line_amount: 7500000,
      sequence_no: 1,
    });
    assert.equal(error, undefined);
  });

  test('rejects a zero or negative quantity when quantity is supplied', () => {
    const { error } = createInvoiceLineForInvoice.validate({
      description: 'Excavation',
      quantity: 0,
      rate: 100,
      line_amount: 0,
      sequence_no: 1,
    });
    assert.notEqual(error, undefined);
  });
});

describe('clmPayment.validator (§6.9 - no invoice_id on the payment itself, allocation is separate)', () => {
  test('accepts a valid payment payload', () => {
    const { error } = createPayment.validate({
      payment_reference_number: 'PAY-2026-0301',
      client_id: VALID_UUID,
      payment_date: '2026-02-05',
      amount: 7350000,
      payment_method: 'Bank Transfer',
    });
    assert.equal(error, undefined);
  });

  test('rejects a zero or negative amount', () => {
    const { error } = createPayment.validate({
      payment_reference_number: 'PAY-2026-0301',
      client_id: VALID_UUID,
      payment_date: '2026-02-05',
      amount: 0,
      payment_method: 'Bank Transfer',
    });
    assert.notEqual(error, undefined);
  });

  test('rejects an out-of-enum payment_method', () => {
    const { error } = createPayment.validate({
      payment_reference_number: 'PAY-2026-0301',
      client_id: VALID_UUID,
      payment_date: '2026-02-05',
      amount: 100,
      payment_method: 'Crypto',
    });
    assert.notEqual(error, undefined);
  });
});

describe('clmPaymentAllocation.validator (§6.10 - SUM-across-rows guard lives in the DB trigger, not here)', () => {
  test('accepts a valid allocation payload', () => {
    const { error } = createAllocationForPayment.validate({
      invoice_id: VALID_UUID,
      allocated_amount: 7350000,
      allocated_date: '2026-02-06',
    });
    assert.equal(error, undefined);
  });

  test('rejects a zero or negative allocated_amount', () => {
    const { error } = createAllocationForPayment.validate({
      invoice_id: VALID_UUID,
      allocated_amount: 0,
      allocated_date: '2026-02-06',
    });
    assert.notEqual(error, undefined);
  });
});
