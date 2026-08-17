'use strict';

const Joi = require('joi');
const { uuid } = require('../../../shared/backend/validators/common.validator');

const cost = () => Joi.number().min(0).precision(2).default(0);

const createEstimationItem = Joi.object({
  estimation_id: uuid.required(),
  rfq_item_id: uuid.required(),
  material_cost: cost(),
  labour_cost: cost(),
  equipment_cost: cost(),
  subcontract_cost: cost(),
  transportation_cost: cost(),
  other_direct_cost: cost(),
  overhead_cost: cost(),
  contingency_cost: cost(),
  remarks: Joi.string().allow('', null),
});

const createEstimationItemForEstimation = createEstimationItem.fork(['estimation_id'], (s) => s.optional());

const updateEstimationItem = Joi.object({
  material_cost: Joi.number().min(0).precision(2),
  labour_cost: Joi.number().min(0).precision(2),
  equipment_cost: Joi.number().min(0).precision(2),
  subcontract_cost: Joi.number().min(0).precision(2),
  transportation_cost: Joi.number().min(0).precision(2),
  other_direct_cost: Joi.number().min(0).precision(2),
  overhead_cost: Joi.number().min(0).precision(2),
  contingency_cost: Joi.number().min(0).precision(2),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createEstimationItem, createEstimationItemForEstimation, updateEstimationItem };
