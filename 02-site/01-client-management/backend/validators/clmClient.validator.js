'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');
const { CLM_CLIENT_STATUS } = require('../../../../shared/backend/models/enums');

const address = {
  line1: Joi.string().max(255),
  line2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100),
  state: Joi.string().max(100),
  country: Joi.string().max(100),
  pincode: Joi.string().max(12),
};

const createClient = Joi.object({
  client_code: Joi.string().max(30).required(),
  legal_name: Joi.string().max(200).required(),
  display_name: Joi.string().max(200).required(),
  client_type_id: uuid.required(),
  industry_id: uuid.optional(),
  gstin: Joi.string().max(15).allow('', null),
  pan: Joi.string().max(10).allow('', null),
  registration_number: Joi.string().max(50).allow('', null),

  billing_address_line1: address.line1.required(),
  billing_address_line2: address.line2,
  billing_city: address.city.required(),
  billing_state: address.state.required(),
  billing_country: address.country.default('India'),
  billing_pincode: address.pincode.required(),

  registered_address_line1: address.line1.allow('', null),
  registered_address_line2: address.line2,
  registered_city: address.city.allow('', null),
  registered_state: address.state.allow('', null),
  registered_country: address.country.allow('', null),
  registered_pincode: address.pincode.allow('', null),

  site_office_address_line1: Joi.string().max(255).allow('', null),
  site_office_city: Joi.string().max(100).allow('', null),
  site_office_state: Joi.string().max(100).allow('', null),

  primary_email: Joi.string().email().max(150).required(),
  secondary_email: Joi.string().email().max(150).allow('', null),
  primary_phone: Joi.string().max(20).required(),
  secondary_phone: Joi.string().max(20).allow('', null),
  website: Joi.string().uri().max(200).allow('', null),

  default_tax_id: uuid.optional(),
  payment_terms: Joi.string().allow('', null),
  credit_terms: Joi.string().allow('', null),
  credit_limit_amount: Joi.number().min(0).allow(null),

  client_status: Joi.string().valid(...CLM_CLIENT_STATUS).default('Prospect'),
  onboarding_date: Joi.date().iso().allow(null),
  notes: Joi.string().allow('', null),
});

const updateClient = Joi.object({
  legal_name: Joi.string().max(200),
  display_name: Joi.string().max(200),
  client_type_id: uuid,
  industry_id: uuid.allow(null),
  gstin: Joi.string().max(15).allow('', null),
  pan: Joi.string().max(10).allow('', null),
  registration_number: Joi.string().max(50).allow('', null),

  billing_address_line1: address.line1,
  billing_address_line2: address.line2,
  billing_city: address.city,
  billing_state: address.state,
  billing_country: address.country,
  billing_pincode: address.pincode,

  registered_address_line1: address.line1.allow('', null),
  registered_address_line2: address.line2,
  registered_city: address.city.allow('', null),
  registered_state: address.state.allow('', null),
  registered_country: address.country.allow('', null),
  registered_pincode: address.pincode.allow('', null),

  site_office_address_line1: Joi.string().max(255).allow('', null),
  site_office_city: Joi.string().max(100).allow('', null),
  site_office_state: Joi.string().max(100).allow('', null),

  primary_email: Joi.string().email().max(150),
  secondary_email: Joi.string().email().max(150).allow('', null),
  primary_phone: Joi.string().max(20),
  secondary_phone: Joi.string().max(20).allow('', null),
  website: Joi.string().uri().max(200).allow('', null),

  default_tax_id: uuid.allow(null),
  payment_terms: Joi.string().allow('', null),
  credit_terms: Joi.string().allow('', null),
  credit_limit_amount: Joi.number().min(0).allow(null),

  client_status: Joi.string().valid(...CLM_CLIENT_STATUS),
  onboarding_date: Joi.date().iso().allow(null),
  notes: Joi.string().allow('', null),
}).min(1);

module.exports = { createClient, updateClient };
