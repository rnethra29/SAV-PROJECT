'use strict';

const Joi = require('joi');
const { uuid } = require('../../../backend/validators/common.validator');

const createRole = Joi.object({
  role_name: Joi.string().max(100).required(),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean().default(true),
});

const updateRole = Joi.object({
  role_name: Joi.string().max(100),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean(),
}).min(1);

const createPermission = Joi.object({
  permission_code: Joi.string().max(100).required(),
  module: Joi.string().max(50).required(),
  description: Joi.string().allow('', null),
});

const grantPermission = Joi.object({
  permission_id: uuid.required(),
});

const assignRole = Joi.object({
  role_id: uuid.required(),
});

module.exports = { createRole, updateRole, createPermission, grantPermission, assignRole };
