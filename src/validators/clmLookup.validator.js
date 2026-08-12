'use strict';

const Joi = require('joi');

const createClientType = Joi.object({ type_name: Joi.string().max(100).required(), is_active: Joi.boolean().default(true) });
const updateClientType = Joi.object({ type_name: Joi.string().max(100), is_active: Joi.boolean() }).min(1);

const createIndustry = Joi.object({ industry_name: Joi.string().max(100).required(), is_active: Joi.boolean().default(true) });
const updateIndustry = Joi.object({ industry_name: Joi.string().max(100), is_active: Joi.boolean() }).min(1);

const createContactType = Joi.object({ type_name: Joi.string().max(100).required(), is_active: Joi.boolean().default(true) });
const updateContactType = Joi.object({ type_name: Joi.string().max(100), is_active: Joi.boolean() }).min(1);

module.exports = {
  createClientType, updateClientType,
  createIndustry, updateIndustry,
  createContactType, updateContactType,
};
