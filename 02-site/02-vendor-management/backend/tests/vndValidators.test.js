'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { createProject } = require('../validators/clmProject.validator');
const { createExpense } = require('../validators/clmProjectExpense.validator');
const { createVendor } = require('../validators/vndVendor.validator');
const { createPurchaseOrder, receivePoItems } = require('../validators/vndPurchaseOrder.validator');
const { createItemForPo } = require('../validators/vndPurchaseOrderItem.validator');
const { createVendorInvoice } = require('../validators/vndVendorInvoice.validator');
const { createInvoiceItemForInvoice } = require('../validators/vndVendorInvoiceItem.validator');
const { createPayment, createAllocationForPayment } = require('../validators/vndVendorPayment.validator');

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('clmProject.validator (architecture doc §6.1 - the hub every financial fact hangs off)', () => {
  test('accepts a minimal valid project payload, defaulting project_status and progress_percentage', () => {
    const { error, value } = createProject.validate({
      project_code: 'PRJ-2026-0031',
      project_name: 'JSW Foundation',
      client_id: VALID_UUID,
      site_location: 'Chennai Site 4',
      contract_value: 30000000,
    });
    assert.equal(error, undefined);
    assert.equal(value.project_status, 'Planning');
    assert.equal(value.progress_percentage, 0);
  });

  test('rejects a negative contract_value', () => {
    const { error } = createProject.validate({
      project_code: 'PRJ-2026-0031',
      project_name: 'JSW Foundation',
      client_id: VALID_UUID,
      site_location: 'Chennai Site 4',
      contract_value: -1,
    });
    assert.notEqual(error, undefined);
  });
});

describe('clmProjectExpense.validator (§6.3 - source-provided CHECK is re-validated in the service, not here)', () => {
  test('accepts a valid expense payload', () => {
    const { error } = createExpense.validate({
      project_id: VALID_UUID,
      expense_category: 'Material',
      vendor_id: VALID_UUID,
      description: 'Cement delivery',
      amount: 150000,
      expense_date: '2026-02-10',
    });
    assert.equal(error, undefined);
  });

  test('rejects a zero or negative amount', () => {
    const { error } = createExpense.validate({
      project_id: VALID_UUID,
      expense_category: 'Other',
      description: 'Statutory fee',
      amount: 0,
      expense_date: '2026-02-10',
    });
    assert.notEqual(error, undefined);
  });
});

describe('vndVendor.validator (§6.6)', () => {
  const validVendor = {
    vendor_code: 'VEN-0001',
    vendor_name: 'Ultratech Cement Ltd.',
    vendor_type_id: VALID_UUID,
    address_line1: 'Industrial Estate',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
  };

  test('accepts a valid vendor payload, defaulting country/vendor_status', () => {
    const { error, value } = createVendor.validate(validVendor);
    assert.equal(error, undefined);
    assert.equal(value.country, 'India');
    assert.equal(value.vendor_status, 'Active');
  });

  test('rejects an out-of-enum vendor_status', () => {
    const { error } = createVendor.validate({ ...validVendor, vendor_status: 'Deleted' });
    assert.notEqual(error, undefined);
  });
});

describe('vndPurchaseOrder.validator (§6.11 - subtotal/tax/total are trigger-maintained, never accepted here)', () => {
  test('accepts a valid PO header payload', () => {
    const { error } = createPurchaseOrder.validate({
      po_number: 'PO-2026-0001',
      project_id: VALID_UUID,
      vendor_id: VALID_UUID,
      po_date: '2026-02-01',
    });
    assert.equal(error, undefined);
  });

  test('receivePoItems requires at least one item with a non-negative receivedQuantity', () => {
    const { error } = receivePoItems.validate({ items: [{ poItemId: VALID_UUID, receivedQuantity: -1 }] });
    assert.notEqual(error, undefined);
  });
});

describe('vndPurchaseOrderItem.validator (§6.12 - line_amount is a same-row GENERATED column, never accepted)', () => {
  test('accepts a valid PO item payload', () => {
    const { error } = createItemForPo.validate({
      item_name: 'OPC 53 Grade Cement',
      quantity: 500,
      unit: 'bags',
      unit_price: 380,
      sequence_no: 1,
    });
    assert.equal(error, undefined);
  });

  test('rejects a zero or negative quantity', () => {
    const { error } = createItemForPo.validate({
      item_name: 'OPC 53 Grade Cement',
      quantity: 0,
      unit: 'bags',
      unit_price: 380,
      sequence_no: 1,
    });
    assert.notEqual(error, undefined);
  });
});

describe('vndVendorInvoice.validator (§6.13 - total_amount is DB-generated, never accepted)', () => {
  test('accepts a valid vendor invoice payload and strips a total_amount if one is somehow supplied', () => {
    const { error, value } = createVendorInvoice.validate(
      {
        invoice_number: 'INV-VEN-0001',
        vendor_id: VALID_UUID,
        project_id: VALID_UUID,
        invoice_date: '2026-02-15',
        subtotal_amount: 190000,
        total_amount: 999,
      },
      { stripUnknown: true }
    );
    assert.equal(error, undefined);
    assert.equal(value.total_amount, undefined);
  });
});

describe('vndVendorInvoiceItem.validator (§6.14 - a bare child row, no company_id/audit columns accepted)', () => {
  test('accepts a valid invoice line payload', () => {
    const { error } = createInvoiceItemForInvoice.validate({
      description: 'Cement supply against PO-2026-0001',
      quantity: 500,
      rate: 380,
      sequence_no: 1,
    });
    assert.equal(error, undefined);
  });
});

describe('vndVendorPayment.validator (§6.15/§6.16)', () => {
  test('accepts a valid payment payload', () => {
    const { error } = createPayment.validate({
      payment_reference_number: 'VPAY-2026-0001',
      vendor_id: VALID_UUID,
      payment_date: '2026-02-20',
      amount: 190000,
      payment_method: 'Bank Transfer',
    });
    assert.equal(error, undefined);
  });

  test('rejects an out-of-enum payment_method', () => {
    const { error } = createPayment.validate({
      payment_reference_number: 'VPAY-2026-0001',
      vendor_id: VALID_UUID,
      payment_date: '2026-02-20',
      amount: 190000,
      payment_method: 'Crypto',
    });
    assert.notEqual(error, undefined);
  });

  test('createAllocationForPayment rejects a zero or negative allocated_amount', () => {
    const { error } = createAllocationForPayment.validate({
      vendor_invoice_id: VALID_UUID,
      allocated_amount: 0,
      allocated_date: '2026-02-21',
    });
    assert.notEqual(error, undefined);
  });
});
