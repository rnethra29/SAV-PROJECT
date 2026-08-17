'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');
const { CLM_INVOICE_STATUS } = require('../../../../shared/backend/models/enums');

// net_amount is a same-row GENERATED column (gross + tax - deduction -
// retention) - deliberately never accepted here (doc §6.7 design note).
const createClientInvoice = Joi.object({
  invoice_number: Joi.string().max(50).required(),
  client_id: uuid.required(),
  project_id: uuid.required(),
  po_id: uuid.optional(),
  boq_id: uuid.optional(),
  invoice_date: Joi.date().iso().required(),
  billing_period_start: Joi.date().iso().allow(null),
  billing_period_end: Joi.date().iso().allow(null),
  gross_amount: Joi.number().min(0).required(),
  tax_amount: Joi.number().min(0).default(0),
  deduction_amount: Joi.number().min(0).default(0),
  retention_amount: Joi.number().min(0).default(0),
  due_date: Joi.date().iso().allow(null),
  status: Joi.string().valid(...CLM_INVOICE_STATUS).default('Draft'),
  remarks: Joi.string().allow('', null),
});

const createClientInvoiceForClient = createClientInvoice.fork('client_id', (s) => s.optional());

const updateClientInvoice = Joi.object({
  project_id: uuid,
  po_id: uuid.allow(null),
  boq_id: uuid.allow(null),
  invoice_date: Joi.date().iso(),
  billing_period_start: Joi.date().iso().allow(null),
  billing_period_end: Joi.date().iso().allow(null),
  gross_amount: Joi.number().min(0),
  tax_amount: Joi.number().min(0),
  deduction_amount: Joi.number().min(0),
  retention_amount: Joi.number().min(0),
  due_date: Joi.date().iso().allow(null),
  status: Joi.string().valid(...CLM_INVOICE_STATUS),
  remarks: Joi.string().allow('', null),
  statusChangeRemarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createClientInvoice, createClientInvoiceForClient, updateClientInvoice };
