'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');

const createMarketPrice = Joi.object({
  rfq_item_id: uuid.required(),
  source_type_id: uuid.required(),
  source_reference: Joi.string().max(200).allow('', null),
  rate: Joi.number().min(0).precision(4).required(),
  unit: Joi.string().max(20).required(),
  currency_id: uuid.required(),
  price_date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null),
});

const createMarketPriceForRfqItem = createMarketPrice.fork(['rfq_item_id'], (s) => s.optional());

module.exports = { createMarketPrice, createMarketPriceForRfqItem };
