'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');

const createRatingForVendor = Joi.object({
  purchase_order_id: uuid.optional(),
  quality_rating: Joi.number().integer().min(1).max(5).required(),
  delivery_rating: Joi.number().integer().min(1).max(5).required(),
  price_rating: Joi.number().integer().min(1).max(5).required(),
  remarks: Joi.string().allow('', null),
});

module.exports = { createRatingForVendor };
