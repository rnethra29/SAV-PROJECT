'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { ESTIMATION_STATUS } = require('../models/enums');

const createEstimation = Joi.object({
  rfq_id: uuid.required(),
  estimation_number: Joi.string().max(50).required(),
  status: Joi.string().valid(...ESTIMATION_STATUS).default('Draft'),
  prepared_by: uuid.optional(),
  remarks: Joi.string().allow('', null),
});

const updateEstimation = Joi.object({
  status: Joi.string().valid(...ESTIMATION_STATUS),
  prepared_by: uuid,
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createEstimation, updateEstimation };
