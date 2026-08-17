'use strict';

/**
 * Static seed data for the Client Management submodule's three Lookup
 * tables (Sites module - architecture doc §6.1/§6.2/§6.4 note). Client
 * types/industries are generic starter sets; contact types mirror the
 * departments called out by name in doc §6.4 ("Project Manager/Accounts/
 * Purchase/Site Engineer/Finance/Management").
 */

const CLIENT_TYPES = ['Government', 'Private', 'Individual', 'Contractor', 'PSU/Semi-Government'].map((type_name) => ({ type_name }));

const INDUSTRIES = [
  'Construction & Infrastructure',
  'Real Estate',
  'Manufacturing',
  'Oil & Gas',
  'Power & Energy',
  'Steel & Metals',
  'Chemicals',
  'Other',
].map((industry_name) => ({ industry_name }));

const CONTACT_TYPES = ['Project Manager', 'Accounts', 'Purchase', 'Site Engineer', 'Finance', 'Management'].map((type_name) => ({ type_name }));

module.exports = { CLIENT_TYPES, INDUSTRIES, CONTACT_TYPES };
