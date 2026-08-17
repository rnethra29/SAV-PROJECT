'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');

const createInvoiceItemForInvoice = Joi.object({
  po_item_id: uuid.optional(),
  description: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().max(20).allow('', null),
  rate: Joi.number().min(0).required(),
  sequence_no: Joi.number().integer().min(1).required(),
});

const updateInvoiceItem = Joi.object({
  po_item_id: uuid.allow(null),
  description: Joi.string(),
  quantity: Joi.number().positive(),
  unit: Joi.string().max(20).allow('', null),
  rate: Joi.number().min(0),
  sequence_no: Joi.number().integer().min(1),
}).min(1);

module.exports = { createInvoiceItemForInvoice, updateInvoiceItem };
