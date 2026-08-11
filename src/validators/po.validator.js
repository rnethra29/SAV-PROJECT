'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { PO_STATUS } = require('../models/enums');

const createPo = Joi.object({
  po_number: Joi.string().max(50).required(),
  po_date: Joi.date().iso().required(),
  vendor_id: uuid.required(),
  project_id: uuid.required(),
  site_id: uuid.optional(),
  boq_id: uuid.optional(),
  quotation_id: uuid.optional(),
  rfq_id: uuid.optional(),
  payment_terms: Joi.string().allow('', null),
  delivery_timeline: Joi.string().allow('', null),
  terms_and_conditions: Joi.string().allow('', null),
  status: Joi.string().valid(...PO_STATUS).default('Draft'),
  remarks: Joi.string().allow('', null),
});

const generateFromBoqLine = Joi.object({
  boq_item_id: uuid.required(),
  quantity: Joi.number().positive().precision(3).optional(),
  rate: Joi.number().min(0).precision(4).optional(),
  tax_percentage: Joi.number().min(0).max(100).precision(2).optional(),
  sequence_no: Joi.number().integer().min(0).optional(),
  remarks: Joi.string().allow('', null),
});

const generateFromBoq = Joi.object({
  boq_id: uuid.required(),
  po_number: Joi.string().max(50).required(),
  po_date: Joi.date().iso().required(),
  vendor_id: uuid.required(),
  payment_terms: Joi.string().allow('', null),
  delivery_timeline: Joi.string().allow('', null),
  terms_and_conditions: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
  items: Joi.array().items(generateFromBoqLine).min(1).required(),
});

const updatePo = Joi.object({
  status: Joi.string().valid(...PO_STATUS),
  payment_terms: Joi.string().allow('', null),
  delivery_timeline: Joi.string().allow('', null),
  terms_and_conditions: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createPo, generateFromBoq, updatePo };
