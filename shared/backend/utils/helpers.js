'use strict';

/**
 * Whitespace word count - mirrors the DB helper `com_fn_word_count()` used
 * for the BOQ 50-word description rule (architecture Phase 1 rule #6,
 * Phase 10). Kept in sync intentionally: the API validates first (fast
 * user feedback), the DB CHECK constraint is the defense-in-depth net.
 * @param {string} text
 * @returns {number}
 */
function wordCount(text) {
  if (!text || !String(text).trim()) return 0;
  return String(text).trim().split(/\s+/).length;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

/**
 * Normalizes `?page=&limit=` query params.
 * @param {Record<string, any>} query
 */
function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Whitelists a requested sort column against a known set, falling back to
 * a safe default. Prevents SQL-injection-by-identifier since column names
 * cannot be parameterized with placeholders.
 * @param {string} requested
 * @param {string[]} allowed
 * @param {string} fallback
 */
function parseSortColumn(requested, allowed, fallback) {
  return allowed.includes(requested) ? requested : fallback;
}

function parseSortDir(requested) {
  return String(requested).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
}

/**
 * Safe percentage: (numerator / denominator) * 100, rounded, null-guarded
 * against a zero/absent denominator - mirrors the NULLIF-style guards used
 * throughout v_item_commercial_analysis.
 */
function safePercentage(numerator, denominator, decimals = 2) {
  if (denominator === null || denominator === undefined || Number(denominator) === 0) return null;
  const value = (Number(numerator) / Number(denominator)) * 100;
  return Number(value.toFixed(decimals));
}

function round(value, decimals = 2) {
  if (value === null || value === undefined) return null;
  return Number(Number(value).toFixed(decimals));
}

module.exports = {
  wordCount,
  parsePagination,
  parseSortColumn,
  parseSortDir,
  safePercentage,
  round,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
