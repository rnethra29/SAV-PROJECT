'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { RFQ_STATUS } = require('../models/enums');

const createRfq = Joi.object({
  rfq_number: Joi.string().max(50).required(),
  client_id: uuid.required(),
  project_id: uuid.required(),
  site_id: uuid.optional(),
  rfq_date: Joi.date().iso().required(),
  scope_of_work: Joi.string().allow('', null),
  execution_timeline: Joi.string().allow('', null),
  payment_terms: Joi.string().allow('', null),
  status: Joi.string().valid(...RFQ_STATUS).default('Draft'),
  remarks: Joi.string().allow('', null),
});

const updateRfq = Joi.object({
  client_id: uuid,
  project_id: uuid,
  site_id: uuid.allow(null),
  rfq_date: Joi.date().iso(),
  scope_of_work: Joi.string().allow('', null),
  execution_timeline: Joi.string().allow('', null),
  payment_terms: Joi.string().allow('', null),
  status: Joi.string().valid(...RFQ_STATUS),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createRfq, updateRfq };
