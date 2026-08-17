'use strict';

const Joi = require('joi');

const createBankAccountForVendor = Joi.object({
  account_holder_name: Joi.string().max(150).required(),
  bank_name: Joi.string().max(150).required(),
  account_number: Joi.string().max(30).required(),
  ifsc_code: Joi.string().max(11).required(),
  branch: Joi.string().max(150).allow('', null),
  account_type: Joi.string().valid('Savings', 'Current').allow('', null),
  upi_id: Joi.string().max(100).allow('', null),
  is_primary: Joi.boolean().default(true),
});

const updateBankAccount = Joi.object({
  account_holder_name: Joi.string().max(150),
  bank_name: Joi.string().max(150),
  account_number: Joi.string().max(30),
  ifsc_code: Joi.string().max(11),
  branch: Joi.string().max(150).allow('', null),
  account_type: Joi.string().valid('Savings', 'Current').allow('', null),
  upi_id: Joi.string().max(100).allow('', null),
  is_primary: Joi.boolean(),
}).min(1);

module.exports = { createBankAccountForVendor, updateBankAccount };
