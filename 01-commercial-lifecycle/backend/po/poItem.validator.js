'use strict';

const Joi = require('joi');
const { uuid } = require('../../../shared/backend/validators/common.validator');

const createPoItem = Joi.object({
  po_id: uuid.required(),
  boq_item_id: uuid.optional(),
  description: Joi.string().optional(), // may default from boq_item_id server-side
  unit: Joi.string().max(20).optional(),
  quantity: Joi.number().positive().precision(3).required(),
  rate: Joi.number().min(0).precision(4).optional(),
  tax_percentage: Joi.number().min(0).max(100).precision(2).default(0),
  sequence_no: Joi.number().integer().min(0).required(),
  remarks: Joi.string().allow('', null),
});

const createPoItemForPo = createPoItem.fork(['po_id'], (s) => s.optional());

const updatePoItem = Joi.object({
  description: Joi.string(),
  unit: Joi.string().max(20),
  quantity: Joi.number().positive().precision(3),
  rate: Joi.number().min(0).precision(4),
  tax_percentage: Joi.number().min(0).max(100).precision(2),
  sequence_no: Joi.number().integer().min(0),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createPoItem, createPoItemForPo, updatePoItem };
