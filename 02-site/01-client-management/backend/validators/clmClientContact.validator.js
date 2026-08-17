'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');

const createClientContactForClient = Joi.object({
  contact_name: Joi.string().max(150).required(),
  designation: Joi.string().max(100).allow('', null),
  department: Joi.string().max(100).allow('', null),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  alternate_phone: Joi.string().max(20).allow('', null),
  contact_type_id: uuid.required(),
  is_primary_contact: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
  notes: Joi.string().allow('', null),
});

const updateClientContact = Joi.object({
  contact_name: Joi.string().max(150),
  designation: Joi.string().max(100).allow('', null),
  department: Joi.string().max(100).allow('', null),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  alternate_phone: Joi.string().max(20).allow('', null),
  contact_type_id: uuid,
  is_primary_contact: Joi.boolean(),
  is_active: Joi.boolean(),
  notes: Joi.string().allow('', null),
}).min(1);

module.exports = { createClientContactForClient, updateClientContact };
