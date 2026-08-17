'use strict';

const Joi = require('joi');
const { uuid } = require('../../../shared/backend/validators/common.validator');

const createRfqItem = Joi.object({
  rfq_id: uuid.required(),
  parent_item_id: uuid.optional(),
  item_code: Joi.string().max(30).required(),
  category_id: uuid.optional(),
  description: Joi.string().required(),
  unit: Joi.string().max(20).required(),
  quantity: Joi.number().positive().precision(3).required(),
  sequence_no: Joi.number().integer().min(0).required(),
  remarks: Joi.string().allow('', null),
});

// Same shape, but rfq_id is taken from the route param instead of the body.
const createRfqItemForRfq = createRfqItem.fork(['rfq_id'], (s) => s.optional());

const updateRfqItem = Joi.object({
  parent_item_id: uuid.allow(null),
  item_code: Joi.string().max(30),
  category_id: uuid.allow(null),
  description: Joi.string(),
  unit: Joi.string().max(20),
  quantity: Joi.number().positive().precision(3),
  sequence_no: Joi.number().integer().min(0),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createRfqItem, createRfqItemForRfq, updateRfqItem };
