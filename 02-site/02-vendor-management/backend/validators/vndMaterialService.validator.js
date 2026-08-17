'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');

const createMaterialServiceForVendor = Joi.object({
  material_category_id: uuid.optional(),
  item_name: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  unit: Joi.string().max(20).required(),
  standard_rate: Joi.number().min(0).allow(null),
  tax_rate: Joi.number().min(0).default(0),
  minimum_order_quantity: Joi.number().min(0).allow(null),
  delivery_time_days: Joi.number().integer().min(0).allow(null),
  is_active: Joi.boolean().default(true),
});

const updateMaterialService = Joi.object({
  material_category_id: uuid.allow(null),
  item_name: Joi.string().max(200),
  description: Joi.string().allow('', null),
  unit: Joi.string().max(20),
  standard_rate: Joi.number().min(0).allow(null),
  tax_rate: Joi.number().min(0),
  minimum_order_quantity: Joi.number().min(0).allow(null),
  delivery_time_days: Joi.number().integer().min(0).allow(null),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createMaterialServiceForVendor, updateMaterialService };
