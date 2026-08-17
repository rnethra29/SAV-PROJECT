'use strict';

/**
 * Static seed data for the Vendor Management & Procurement submodule's two
 * Lookup tables (Sites module - architecture doc §6.4/§6.5). Vendor types
 * taken verbatim from doc §6.4's "Seeded values"; material categories are a
 * sensible construction-procurement starter set (not prescribed by the doc).
 */

const VENDOR_TYPES = ['Material Supplier', 'Equipment Supplier', 'Subcontractor', 'Service Provider', 'Transporter'].map((type_name) => ({ type_name }));

const MATERIAL_CATEGORIES = [
  'Cement & Concrete',
  'Steel & Reinforcement',
  'Aggregates & Sand',
  'Electrical',
  'Plumbing',
  'Hardware & Fasteners',
  'Formwork & Shuttering',
  'Equipment Rental',
  'Other',
].map((category_name) => ({ category_name }));

module.exports = { VENDOR_TYPES, MATERIAL_CATEGORIES };
