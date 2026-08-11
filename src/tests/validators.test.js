'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { uuid, paginationQuery } = require('../validators/common.validator');
const { createRfqItem } = require('../validators/rfqItem.validator');
const { createBoqItem } = require('../validators/boqItem.validator');
const { createNegotiationOffer } = require('../validators/negotiation.validator');
const { setActualPrice } = require('../validators/actualPrice.validator');

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('common.validator', () => {
  test('uuid rejects non-UUID strings', () => {
    assert.equal(uuid.validate('not-a-uuid').error !== undefined, true);
    assert.equal(uuid.validate(VALID_UUID).error, undefined);
  });

  test('paginationQuery defaults page to 1, limit to 20', () => {
    const { value } = paginationQuery.validate({});
    assert.equal(value.page, 1);
    assert.equal(value.limit, 20);
  });

  test('paginationQuery rejects a limit above 200 (route-level guard; repositories additionally self-clamp via parsePagination)', () => {
    const { error } = paginationQuery.validate({ limit: 5000 });
    assert.notEqual(error, undefined);
  });
});

describe('rfqItem.validator (architecture Phase 5.2: quantity CHECK > 0)', () => {
  const base = {
    rfq_id: VALID_UUID,
    item_code: '2.1(a)',
    description: 'Excavation in ordinary soil up to 1.5m depth',
    unit: 'm3',
    quantity: 500,
    sequence_no: 1,
  };

  test('accepts a valid RFQ item', () => {
    const { error } = createRfqItem.validate(base);
    assert.equal(error, undefined);
  });

  test('rejects zero or negative quantity', () => {
    assert.notEqual(createRfqItem.validate({ ...base, quantity: 0 }).error, undefined);
    assert.notEqual(createRfqItem.validate({ ...base, quantity: -5 }).error, undefined);
  });

  test('rejects missing required fields', () => {
    const { error } = createRfqItem.validate({ ...base, unit: undefined });
    assert.notEqual(error, undefined);
  });
});

describe('boqItem.validator (word-count itself is enforced in the service, not here - see boqItem.service.js)', () => {
  const base = {
    boq_id: VALID_UUID,
    item_code: '2.1(a)',
    description: 'Excavation in ordinary soil up to 1.5m depth',
    unit: 'm3',
    quantity: 500,
    unit_rate: 202,
    sequence_no: 1,
  };

  test('accepts a valid BOQ item with an explicit unit_rate', () => {
    assert.equal(createBoqItem.validate(base).error, undefined);
  });

  test('unit_rate is optional when autoResolveRate is requested', () => {
    const { error } = createBoqItem.validate({ ...base, unit_rate: undefined, autoResolveRate: true, source_rfq_item_id: VALID_UUID_2 });
    assert.equal(error, undefined);
  });

  test('rejects a non-positive quantity', () => {
    assert.notEqual(createBoqItem.validate({ ...base, quantity: 0 }).error, undefined);
  });
});

describe('negotiation.validator cross-field rules (architecture Phase 5.10 CHECK constraint mirror)', () => {
  const quotationLevelBase = {
    quotation_id: VALID_UUID,
    offer_type: 'SAV_Quote',
    offered_by: 'SAV',
    offered_amount: 105000,
  };

  const itemLevelBase = {
    quotation_id: VALID_UUID,
    quotation_item_id: VALID_UUID_2,
    offer_type: 'Client_Offer',
    offered_by: 'Client',
    offered_rate: 190,
  };

  test('accepts a valid quotation-level offer (offered_amount, no quotation_item_id)', () => {
    assert.equal(createNegotiationOffer.validate(quotationLevelBase).error, undefined);
  });

  test('accepts a valid item-level offer (offered_rate, quotation_item_id set)', () => {
    assert.equal(createNegotiationOffer.validate(itemLevelBase).error, undefined);
  });

  test('rejects offered_rate on a quotation-level offer', () => {
    const { error } = createNegotiationOffer.validate({ ...quotationLevelBase, offered_rate: 190 });
    assert.notEqual(error, undefined);
  });

  test('rejects offered_amount on an item-level offer', () => {
    const { error } = createNegotiationOffer.validate({ ...itemLevelBase, offered_amount: 105000 });
    assert.notEqual(error, undefined);
  });

  test('rejects missing offered_rate on an item-level offer', () => {
    const { offered_rate, ...withoutRate } = itemLevelBase;
    assert.notEqual(createNegotiationOffer.validate(withoutRate).error, undefined);
  });

  test('is_final=true requires offer_type="Final"', () => {
    const { error } = createNegotiationOffer.validate({ ...itemLevelBase, offer_type: 'Client_Counter', is_final: true });
    assert.notEqual(error, undefined);
  });

  test('is_final=true with offer_type="Final" is accepted', () => {
    const { error } = createNegotiationOffer.validate({ ...itemLevelBase, offer_type: 'Final', is_final: true });
    assert.equal(error, undefined);
  });
});

describe('actualPrice.validator', () => {
  const base = {
    actual_rate: 180,
    unit: 'm3',
    currency_id: VALID_UUID,
    price_basis: 'Approved Estimation Rate',
    price_date: '2026-01-15',
  };

  test('accepts a valid payload', () => {
    assert.equal(setActualPrice.validate(base).error, undefined);
  });

  test('rejects an out-of-enum price_basis', () => {
    assert.notEqual(setActualPrice.validate({ ...base, price_basis: 'Made Up Basis' }).error, undefined);
  });

  test('rejects a negative actual_rate', () => {
    assert.notEqual(setActualPrice.validate({ ...base, actual_rate: -1 }).error, undefined);
  });
});
