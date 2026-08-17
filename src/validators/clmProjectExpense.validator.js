'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { CLM_COST_CATEGORY } = require('../models/enums');

const createExpense = Joi.object({
  project_id: uuid.required(),
  expense_category: Joi.string().valid(...CLM_COST_CATEGORY).required(),
  vendor_id: uuid.optional(),
  purchase_order_id: uuid.optional(),
  subcontract_po_id: uuid.optional(),
  vendor_invoice_id: uuid.optional(),
  description: Joi.string().required(),
  amount: Joi.number().positive().required(),
  expense_date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null),
});

const createExpenseForProject = createExpense.fork('project_id', (s) => s.optional());

const updateExpense = Joi.object({
  expense_category: Joi.string().valid(...CLM_COST_CATEGORY),
  vendor_id: uuid.allow(null),
  purchase_order_id: uuid.allow(null),
  subcontract_po_id: uuid.allow(null),
  vendor_invoice_id: uuid.allow(null),
  description: Joi.string(),
  amount: Joi.number().positive(),
  expense_date: Joi.date().iso(),
  remarks: Joi.string().allow('', null),
}).min(1);

const decideExpenseApproval = Joi.object({
  status: Joi.string().valid('Approved', 'Rejected').required(),
  remarks: Joi.string().allow('', null),
});

module.exports = { createExpense, createExpenseForProject, updateExpense, decideExpenseApproval };
