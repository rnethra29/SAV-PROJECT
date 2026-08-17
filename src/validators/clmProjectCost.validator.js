'use strict';

const Joi = require('joi');
const { CLM_COST_CATEGORY } = require('../models/enums');

const createCostForProject = Joi.object({
  cost_category: Joi.string().valid(...CLM_COST_CATEGORY).required(),
  estimated_cost: Joi.number().min(0).default(0),
  budgeted_cost: Joi.number().min(0).default(0),
  remarks: Joi.string().allow('', null),
});

const updateCost = Joi.object({
  cost_category: Joi.string().valid(...CLM_COST_CATEGORY),
  estimated_cost: Joi.number().min(0),
  budgeted_cost: Joi.number().min(0),
  remarks: Joi.string().allow('', null),
}).min(1);

module.exports = { createCostForProject, updateCost };
