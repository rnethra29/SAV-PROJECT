'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');
const { CLM_REQUIREMENT_PRIORITY, CLM_REQUIREMENT_STATUS } = require('../../../../shared/backend/models/enums');

const createClientRequirement = Joi.object({
  requirement_number: Joi.string().max(50).required(),
  client_id: uuid.required(),
  project_id: uuid.optional(),
  requirement_title: Joi.string().max(200).required(),
  requirement_description: Joi.string().allow('', null),
  received_date: Joi.date().iso().required(),
  required_completion_date: Joi.date().iso().allow(null),
  priority: Joi.string().valid(...CLM_REQUIREMENT_PRIORITY).default('Medium'),
  requirement_status: Joi.string().valid(...CLM_REQUIREMENT_STATUS).default('New'),
  assigned_employee_id: uuid.optional(),
  notes: Joi.string().allow('', null),
});

const createClientRequirementForClient = createClientRequirement.fork('client_id', (s) => s.optional());

const updateClientRequirement = Joi.object({
  project_id: uuid.allow(null),
  requirement_title: Joi.string().max(200),
  requirement_description: Joi.string().allow('', null),
  received_date: Joi.date().iso(),
  required_completion_date: Joi.date().iso().allow(null),
  priority: Joi.string().valid(...CLM_REQUIREMENT_PRIORITY),
  requirement_status: Joi.string().valid(...CLM_REQUIREMENT_STATUS),
  assigned_employee_id: uuid.allow(null),
  notes: Joi.string().allow('', null),
  statusChangeRemarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createClientRequirement, createClientRequirementForClient, updateClientRequirement };
