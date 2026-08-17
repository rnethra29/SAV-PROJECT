'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { VND_VENDOR_STATUS } = require('../models/enums');

const createVendor = Joi.object({
  vendor_code: Joi.string().max(30).required(),
  vendor_name: Joi.string().max(200).required(),
  vendor_type_id: uuid.required(),
  company_type: Joi.string().max(50).allow('', null),
  registration_date: Joi.date().iso().allow(null),
  address_line1: Joi.string().max(255).required(),
  address_line2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  country: Joi.string().max(100).default('India'),
  pincode: Joi.string().max(12).required(),
  website: Joi.string().uri().max(200).allow('', null),
  gst_number: Joi.string().max(15).allow('', null),
  pan_number: Joi.string().max(10).allow('', null),
  gst_registration_type: Joi.string().max(50).allow('', null),
  msme_status: Joi.boolean().default(false),
  msme_number: Joi.string().max(30).allow('', null),
  company_registration_number: Joi.string().max(50).allow('', null),
  tds_applicable: Joi.boolean().default(true),
  tds_category: Joi.string().max(50).allow('', null),
  vendor_status: Joi.string().valid(...VND_VENDOR_STATUS).default('Active'),
  notes: Joi.string().allow('', null),
});

const updateVendor = Joi.object({
  vendor_name: Joi.string().max(200),
  vendor_type_id: uuid,
  company_type: Joi.string().max(50).allow('', null),
  registration_date: Joi.date().iso().allow(null),
  address_line1: Joi.string().max(255),
  address_line2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100),
  state: Joi.string().max(100),
  country: Joi.string().max(100),
  pincode: Joi.string().max(12),
  website: Joi.string().uri().max(200).allow('', null),
  gst_number: Joi.string().max(15).allow('', null),
  pan_number: Joi.string().max(10).allow('', null),
  gst_registration_type: Joi.string().max(50).allow('', null),
  msme_status: Joi.boolean(),
  msme_number: Joi.string().max(30).allow('', null),
  company_registration_number: Joi.string().max(50).allow('', null),
  tds_applicable: Joi.boolean(),
  tds_category: Joi.string().max(50).allow('', null),
  vendor_status: Joi.string().valid(...VND_VENDOR_STATUS),
  notes: Joi.string().allow('', null),
}).min(1);

module.exports = { createVendor, updateVendor };
