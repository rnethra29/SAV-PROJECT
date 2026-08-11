'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');

const createQuotationItem = Joi.object({
  quotation_id: uuid.required(),
  rfq_item_id: uuid.required(),
  estimation_item_id: uuid.optional(),
  quoted_rate: Joi.number().min(0).precision(4).required(),
  tax_percentage: Joi.number().min(0).max(100).precision(2).default(0),
  remarks: Joi.string().allow('', null),
});

const createQuotationItemForQuotation = createQuotationItem.fork(['quotation_id'], (s) => s.optional());

const updateQuotationItem = Joi.object({
  quoted_rate: Joi.number().min(0).precision(4),
  tax_percentage: Joi.number().min(0).max(100).precision(2),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createQuotationItem, createQuotationItemForQuotation, updateQuotationItem };
