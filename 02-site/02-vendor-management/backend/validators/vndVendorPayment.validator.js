'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');
const { VND_PAYMENT_METHOD, VND_PAYMENT_STATUS } = require('../../../../shared/backend/models/enums');

const createPayment = Joi.object({
  payment_reference_number: Joi.string().max(100).required(),
  vendor_id: uuid.required(),
  project_id: uuid.optional(),
  bank_account_id: uuid.optional(),
  payment_date: Joi.date().iso().required(),
  amount: Joi.number().positive().required(),
  payment_method: Joi.string().valid(...VND_PAYMENT_METHOD).required(),
  transaction_reference: Joi.string().max(100).allow('', null),
  remarks: Joi.string().allow('', null),
});

const updatePayment = Joi.object({
  project_id: uuid.allow(null),
  bank_account_id: uuid.allow(null),
  payment_date: Joi.date().iso(),
  amount: Joi.number().positive(),
  payment_method: Joi.string().valid(...VND_PAYMENT_METHOD),
  transaction_reference: Joi.string().max(100).allow('', null),
  remarks: Joi.string().allow('', null),
}).min(1);

const decidePaymentStatus = Joi.object({
  status: Joi.string().valid(...VND_PAYMENT_STATUS).required(),
});

const createAllocationForPayment = Joi.object({
  vendor_invoice_id: uuid.required(),
  allocated_amount: Joi.number().positive().required(),
  allocated_date: Joi.date().iso().required(),
});

module.exports = { createPayment, updatePayment, decidePaymentStatus, createAllocationForPayment };
