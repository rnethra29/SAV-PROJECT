'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { PRICE_BASIS } = require('../models/enums');

const setActualPrice = Joi.object({
  actual_rate: Joi.number().min(0).precision(4).required(),
  unit: Joi.string().max(20).required(),
  currency_id: uuid.required(),
  price_basis: Joi.string().valid(...PRICE_BASIS).required(),
  price_source_reference: Joi.string().max(200).allow('', null),
  price_date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null),
});

module.exports = { setActualPrice };
