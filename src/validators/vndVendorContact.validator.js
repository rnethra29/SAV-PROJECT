'use strict';

const Joi = require('joi');

const createContactForVendor = Joi.object({
  contact_name: Joi.string().max(150).required(),
  designation: Joi.string().max(100).allow('', null),
  contact_role: Joi.string().max(50).default('General'),
  mobile_number: Joi.string().max(20).required(),
  alternate_number: Joi.string().max(20).allow('', null),
  email: Joi.string().email().max(150).allow('', null),
  is_primary_contact: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
});

const updateContact = Joi.object({
  contact_name: Joi.string().max(150),
  designation: Joi.string().max(100).allow('', null),
  contact_role: Joi.string().max(50),
  mobile_number: Joi.string().max(20),
  alternate_number: Joi.string().max(20).allow('', null),
  email: Joi.string().email().max(150).allow('', null),
  is_primary_contact: Joi.boolean(),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createContactForVendor, updateContact };
