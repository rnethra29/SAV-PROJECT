'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');
const { VND_INVOICE_STATUS } = require('../../../../shared/backend/models/enums');

// total_amount is a same-row GENERATED column (subtotal + tax) - never accepted here (doc §6.13).
const createVendorInvoice = Joi.object({
  invoice_number: Joi.string().max(50).required(),
  vendor_id: uuid.required(),
  purchase_order_id: uuid.optional(),
  project_id: uuid.required(),
  invoice_date: Joi.date().iso().required(),
  due_date: Joi.date().iso().allow(null),
  subtotal_amount: Joi.number().min(0).required(),
  tax_amount: Joi.number().min(0).default(0),
  remarks: Joi.string().allow('', null),
});

const updateVendorInvoice = Joi.object({
  purchase_order_id: uuid.allow(null),
  invoice_date: Joi.date().iso(),
  due_date: Joi.date().iso().allow(null),
  subtotal_amount: Joi.number().min(0),
  tax_amount: Joi.number().min(0),
  status: Joi.string().valid(...VND_INVOICE_STATUS),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createVendorInvoice, updateVendorInvoice };
