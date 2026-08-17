'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');

const createInvoiceLineForInvoice = Joi.object({
  boq_item_id: uuid.optional(),
  description: Joi.string().required(),
  unit: Joi.string().max(20).allow('', null),
  quantity: Joi.number().positive().allow(null),
  rate: Joi.number().min(0).allow(null),
  line_amount: Joi.number().min(0).required(),
  sequence_no: Joi.number().integer().min(1).required(),
  remarks: Joi.string().allow('', null),
});

const updateInvoiceLine = Joi.object({
  boq_item_id: uuid.allow(null),
  description: Joi.string(),
  unit: Joi.string().max(20).allow('', null),
  quantity: Joi.number().positive().allow(null),
  rate: Joi.number().min(0).allow(null),
  line_amount: Joi.number().min(0),
  sequence_no: Joi.number().integer().min(1),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createInvoiceLineForInvoice, updateInvoiceLine };
