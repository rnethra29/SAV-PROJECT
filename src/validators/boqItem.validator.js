'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');

// The 50-word cap is enforced in the service (word-count is data-dependent,
// not expressible as a simple Joi string rule) and mirrored by the DB CHECK.
const createBoqItem = Joi.object({
  boq_id: uuid.required(),
  parent_item_id: uuid.optional(),
  category_id: uuid.optional(),
  item_code: Joi.string().max(30).required(),
  description: Joi.string().required(),
  unit: Joi.string().max(20).required(),
  quantity: Joi.number().positive().precision(3).required(),
  unit_rate: Joi.number().min(0).precision(4).optional(),
  autoResolveRate: Joi.boolean().default(false),
  sequence_no: Joi.number().integer().min(0).required(),
  source_rfq_item_id: uuid.optional(),
  source_quotation_item_id: uuid.optional(),
  remarks: Joi.string().allow('', null),
});

const createBoqItemForBoq = createBoqItem.fork(['boq_id'], (s) => s.optional());

const updateBoqItem = Joi.object({
  parent_item_id: uuid.allow(null),
  category_id: uuid.allow(null),
  item_code: Joi.string().max(30),
  description: Joi.string(),
  unit: Joi.string().max(20),
  quantity: Joi.number().positive().precision(3),
  unit_rate: Joi.number().min(0).precision(4),
  sequence_no: Joi.number().integer().min(0),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createBoqItem, createBoqItemForBoq, updateBoqItem };
