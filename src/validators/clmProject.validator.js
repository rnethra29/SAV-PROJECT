'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { CLM_PROJECT_STATUS } = require('../models/enums');

const createProject = Joi.object({
  project_code: Joi.string().max(30).required(),
  project_name: Joi.string().max(200).required(),
  client_id: uuid.required(),
  requirement_id: uuid.optional(),
  site_location: Joi.string().max(255).required(),
  description: Joi.string().allow('', null),
  start_date: Joi.date().iso().allow(null),
  expected_completion_date: Joi.date().iso().allow(null),
  actual_completion_date: Joi.date().iso().allow(null),
  contract_value: Joi.number().min(0).required(),
  project_manager_id: uuid.optional(),
  project_status: Joi.string().valid(...CLM_PROJECT_STATUS).default('Planning'),
  progress_percentage: Joi.number().min(0).max(100).default(0),
  remarks: Joi.string().allow('', null),
});

const updateProject = Joi.object({
  project_name: Joi.string().max(200),
  requirement_id: uuid.allow(null),
  site_location: Joi.string().max(255),
  description: Joi.string().allow('', null),
  start_date: Joi.date().iso().allow(null),
  expected_completion_date: Joi.date().iso().allow(null),
  actual_completion_date: Joi.date().iso().allow(null),
  contract_value: Joi.number().min(0),
  project_manager_id: uuid.allow(null),
  project_status: Joi.string().valid(...CLM_PROJECT_STATUS),
  progress_percentage: Joi.number().min(0).max(100),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createProject, updateProject };
