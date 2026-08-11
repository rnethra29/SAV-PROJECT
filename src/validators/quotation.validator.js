'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { QUOTATION_STATUS } = require('../models/enums');

const createQuotation = Joi.object({
  rfq_id: uuid.required(),
  project_id: uuid.required(),
  client_id: uuid.required(),
  quotation_number: Joi.string().max(50).required(),
  quotation_date: Joi.date().iso().required(),
  validity_date: Joi.date().iso().allow(null),
  payment_terms: Joi.string().allow('', null),
  execution_period: Joi.string().allow('', null),
  inclusions: Joi.string().allow('', null),
  exclusions: Joi.string().allow('', null),
  commercial_terms: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

const createNewVersion = Joi.object({
  quotation_date: Joi.date().iso(),
  validity_date: Joi.date().iso().allow(null),
  payment_terms: Joi.string().allow('', null),
  execution_period: Joi.string().allow('', null),
  inclusions: Joi.string().allow('', null),
  exclusions: Joi.string().allow('', null),
  commercial_terms: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
  cloneItems: Joi.boolean().default(true),
});

const updateQuotation = Joi.object({
  validity_date: Joi.date().iso().allow(null),
  status: Joi.string().valid(...QUOTATION_STATUS),
  payment_terms: Joi.string().allow('', null),
  execution_period: Joi.string().allow('', null),
  inclusions: Joi.string().allow('', null),
  exclusions: Joi.string().allow('', null),
  commercial_terms: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createQuotation, createNewVersion, updateQuotation };
