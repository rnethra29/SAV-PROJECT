'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { OFFER_TYPE, OFFER_PARTY, OFFER_RESPONSE_STATUS } = require('../models/enums');

// Mirrors the DB CHECK constraint (architecture Phase 5.10): exactly one of
// offered_amount (quotation-level) / offered_rate (item-level) is set,
// matching whether quotation_item_id is null. Validated in .custom() below
// rather than Joi's schema-conditional `.when()` for clarity/reliability.
const createNegotiationOffer = Joi.object({
  quotation_id: uuid.required(),
  quotation_item_id: uuid.optional(),
  offer_type: Joi.string().valid(...OFFER_TYPE).required(),
  offered_amount: Joi.number().min(0).precision(2).optional(),
  offered_rate: Joi.number().min(0).precision(4).optional(),
  offered_by: Joi.string().valid(...OFFER_PARTY).required(),
  response_status: Joi.string().valid(...OFFER_RESPONSE_STATUS).default('Pending'),
  payment_terms: Joi.string().allow('', null),
  validity_date: Joi.date().iso().allow(null),
  commercial_conditions: Joi.string().allow('', null),
  is_final: Joi.boolean().default(false),
  remarks: Joi.string().allow('', null),
}).custom((value, helpers) => {
  const isItemLevel = Boolean(value.quotation_item_id);

  if (isItemLevel) {
    if (value.offered_rate === undefined) return helpers.message('offered_rate is required for item-level offers (quotation_item_id set)');
    if (value.offered_amount !== undefined) return helpers.message('offered_amount must not be set for item-level offers (quotation_item_id set)');
  } else {
    if (value.offered_amount === undefined) return helpers.message('offered_amount is required for quotation-level offers (no quotation_item_id)');
    if (value.offered_rate !== undefined) return helpers.message('offered_rate must not be set for quotation-level offers (no quotation_item_id)');
  }

  if (value.is_final && value.offer_type !== 'Final') {
    return helpers.message('is_final=true requires offer_type="Final"');
  }

  return value;
}, 'negotiation offer cross-field rules');

module.exports = { createNegotiationOffer };
