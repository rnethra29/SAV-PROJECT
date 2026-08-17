'use strict';

const Joi = require('joi');
const { uuid } = require('../../../shared/backend/validators/common.validator');
const { BOQ_TYPE, BOQ_STATUS } = require('../../../shared/backend/models/enums');

const createBoq = Joi.object({
  boq_number: Joi.string().max(50).required(),
  boq_title: Joi.string().max(200).required(),
  project_id: uuid.required(),
  client_id: uuid.required(),
  site_id: uuid.optional(),
  rfq_id: uuid.required(),
  quotation_id: uuid.optional(),
  boq_type: Joi.string().valid(...BOQ_TYPE).default('Tentative'),
  status: Joi.string().valid(...BOQ_STATUS).default('Draft'),
  remarks: Joi.string().allow('', null),
});

const boqItemLine = Joi.object({
  rfq_item_id: uuid.required(),
  description: Joi.string().required(),
  category_id: uuid.optional(),
  parent_item_id: uuid.optional(),
  sequence_no: Joi.number().integer().min(0).required(),
  unit_rate: Joi.number().min(0).precision(4).optional(),
  remarks: Joi.string().allow('', null),
});

const generateTentativeFromQuotation = Joi.object({
  boq_number: Joi.string().max(50).required(),
  boq_title: Joi.string().max(200).required(),
  project_id: uuid.required(),
  client_id: uuid.required(),
  site_id: uuid.optional(),
  rfq_id: uuid.required(),
  quotation_id: uuid.required(),
  remarks: Joi.string().allow('', null),
  items: Joi.array().items(boqItemLine).min(1).required(),
});

const createNewVersion = Joi.object({
  boq_title: Joi.string().max(200),
  boq_type: Joi.string().valid(...BOQ_TYPE),
  status: Joi.string().valid(...BOQ_STATUS),
  revision_reason: Joi.string().required(),
  remarks: Joi.string().allow('', null),
  cloneItems: Joi.boolean().default(true),
});

const updateBoq = Joi.object({
  boq_title: Joi.string().max(200),
  status: Joi.string().valid(...BOQ_STATUS),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createBoq, generateTentativeFromQuotation, createNewVersion, updateBoq };
