'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { CLM_PAYMENT_METHOD, CLM_VERIFICATION_STATUS } = require('../models/enums');

const createPayment = Joi.object({
  payment_reference_number: Joi.string().max(100).required(),
  client_id: uuid.required(),
  project_id: uuid.optional(),
  payment_date: Joi.date().iso().required(),
  amount: Joi.number().positive().required(),
  payment_method: Joi.string().valid(...CLM_PAYMENT_METHOD).required(),
  bank_reference_details: Joi.string().max(200).allow('', null),
  remarks: Joi.string().allow('', null),
});

const createPaymentForClient = createPayment.fork('client_id', (s) => s.optional());

const updatePayment = Joi.object({
  project_id: uuid.allow(null),
  payment_date: Joi.date().iso(),
  amount: Joi.number().positive(),
  payment_method: Joi.string().valid(...CLM_PAYMENT_METHOD),
  bank_reference_details: Joi.string().max(200).allow('', null),
  remarks: Joi.string().allow('', null),
}).min(1);

const decideVerification = Joi.object({
  status: Joi.string().valid('Verified', 'Rejected').required(),
  remarks: Joi.string().allow('', null),
});

const createAllocationForPayment = Joi.object({
  invoice_id: uuid.required(),
  allocated_amount: Joi.number().positive().required(),
  allocated_date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null),
});

module.exports = {
  createPayment,
  createPaymentForClient,
  updatePayment,
  decideVerification,
  createAllocationForPayment,
  CLM_VERIFICATION_STATUS,
};
