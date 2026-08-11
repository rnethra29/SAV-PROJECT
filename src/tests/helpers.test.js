'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  wordCount,
  parsePagination,
  parseSortColumn,
  parseSortDir,
  safePercentage,
  round,
} = require('../utils/helpers');

describe('wordCount (BOQ 50-word description rule, mirrors com_fn_word_count)', () => {
  test('counts whitespace-delimited words', () => {
    assert.equal(wordCount('Excavation in ordinary soil up to 1.5m depth'), 8);
  });

  test('collapses multiple/irregular whitespace like the SQL regexp_split_to_array(\\s+) does', () => {
    assert.equal(wordCount('  one   two\tthree\nfour  '), 4);
  });

  test('empty/null/whitespace-only text is 0 words', () => {
    assert.equal(wordCount(''), 0);
    assert.equal(wordCount('   '), 0);
    assert.equal(wordCount(null), 0);
    assert.equal(wordCount(undefined), 0);
  });

  test('single word is 1', () => {
    assert.equal(wordCount('Excavation'), 1);
  });
});

describe('parsePagination', () => {
  test('defaults to page 1, limit 20', () => {
    assert.deepEqual(parsePagination({}), { page: 1, limit: 20, offset: 0 });
  });

  test('computes offset from page/limit', () => {
    assert.deepEqual(parsePagination({ page: '3', limit: '10' }), { page: 3, limit: 10, offset: 20 });
  });

  test('rejects non-positive page/limit by falling back to defaults', () => {
    assert.deepEqual(parsePagination({ page: '-1', limit: '0' }), { page: 1, limit: 20, offset: 0 });
  });

  test('caps limit at MAX_LIMIT (200)', () => {
    assert.deepEqual(parsePagination({ page: '1', limit: '9999' }), { page: 1, limit: 200, offset: 0 });
  });

  test('ignores non-numeric input', () => {
    assert.deepEqual(parsePagination({ page: 'abc', limit: 'xyz' }), { page: 1, limit: 20, offset: 0 });
  });
});

describe('parseSortColumn / parseSortDir (whitelisting against SQL-injection-by-identifier)', () => {
  test('accepts a whitelisted column', () => {
    assert.equal(parseSortColumn('status', ['status', 'created_at'], 'created_at'), 'status');
  });

  test('falls back to default for anything not whitelisted', () => {
    assert.equal(parseSortColumn('rfq_id; DROP TABLE com_rfq;--', ['status', 'created_at'], 'created_at'), 'created_at');
    assert.equal(parseSortColumn(undefined, ['status'], 'status'), 'status');
  });

  test('sort direction defaults to DESC, only "asc" (any case) yields ASC', () => {
    assert.equal(parseSortDir('asc'), 'ASC');
    assert.equal(parseSortDir('ASC'), 'ASC');
    assert.equal(parseSortDir('desc'), 'DESC');
    assert.equal(parseSortDir(undefined), 'DESC');
    assert.equal(parseSortDir('nonsense'), 'DESC');
  });
});

describe('safePercentage (zero-denominator guard, mirrors the NULLIF-style guards in v_item_commercial_analysis)', () => {
  test('computes a rounded percentage', () => {
    // architecture Phase 15 example: rate diff 30 / actual rate 180 -> 16.67%
    assert.equal(safePercentage(30, 180), 16.67);
  });

  test('returns null for a zero or missing denominator instead of Infinity/NaN', () => {
    assert.equal(safePercentage(30, 0), null);
    assert.equal(safePercentage(30, null), null);
    assert.equal(safePercentage(30, undefined), null);
  });
});

describe('round', () => {
  test('rounds to 2 decimals by default', () => {
    assert.equal(round(11.005), 11.01); // eslint-disable-line no-loss-of-precision -- fine at this magnitude
    assert.equal(round(15000 / 105000 * 100, 2), 14.29); // Phase 2 step 7: margin = 15000/105000
  });

  test('passes through null/undefined', () => {
    assert.equal(round(null), null);
    assert.equal(round(undefined), null);
  });
});
