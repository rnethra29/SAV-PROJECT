'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');

const createItemForPo = Joi.object({
  material_service_id: uuid.optional(),
  item_name: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().max(20).required(),
  unit_price: Joi.number().min(0).required(),
  discount_amount: Joi.number().min(0).default(0),
  tax_percentage: Joi.number().min(0).default(0),
  sequence_no: Joi.number().integer().min(1).required(),
  remarks: Joi.string().allow('', null),
});

const updateItem = Joi.object({
  material_service_id: uuid.allow(null),
  item_name: Joi.string().max(200),
  description: Joi.string().allow('', null),
  quantity: Joi.number().positive(),
  unit: Joi.string().max(20),
  unit_price: Joi.number().min(0),
  discount_amount: Joi.number().min(0),
  tax_percentage: Joi.number().min(0),
  sequence_no: Joi.number().integer().min(1),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createItemForPo, updateItem };
