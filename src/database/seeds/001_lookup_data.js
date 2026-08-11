'use strict';

/**
 * Static seed data for the three Lookup tables (architecture Phase 4 #18-20).
 * Category names sourced from the sample data in architecture Phase 13,
 * extended with common construction/procurement categories; source types
 * and document categories taken verbatim from the column descriptions in
 * Phase 5.5 / 5.15.
 */

const ITEM_CATEGORIES = [
  'Earth Work & Allied Works',
  'Concrete And Allied Works',
  'Reinforcement Steel Works',
  'Formwork & Shuttering',
  'Masonry Works',
  'Structural Steel Works',
  'Finishing Works',
  'MEP Works',
  'Soil Testing',
  'Others',
].map((category_name, i) => ({ category_name, sequence_no: i + 1 }));

const PRICE_SOURCE_TYPES = [
  'Current Market',
  'Vendor',
  'Internal Purchase',
  'Historical Project',
  'Historical Market',
  'Other',
].map((source_name) => ({ source_name }));

const DOCUMENT_CATEGORIES = [
  'RFQ Document',
  'Estimation Document',
  'Market Price Document',
  'Quotation Document',
  'Negotiation Document',
  'BOQ Document',
  'PO Document',
  'Other',
].map((category_name) => ({ category_name }));

module.exports = { ITEM_CATEGORIES, PRICE_SOURCE_TYPES, DOCUMENT_CATEGORIES };
