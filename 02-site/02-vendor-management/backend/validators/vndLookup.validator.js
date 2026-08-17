'use strict';

const Joi = require('joi');

const createVendorType = Joi.object({ type_name: Joi.string().max(100).required(), is_active: Joi.boolean().default(true) });
const updateVendorType = Joi.object({ type_name: Joi.string().max(100), is_active: Joi.boolean() }).min(1);

const createMaterialCategory = Joi.object({ category_name: Joi.string().max(100).required(), is_active: Joi.boolean().default(true) });
const updateMaterialCategory = Joi.object({ category_name: Joi.string().max(100), is_active: Joi.boolean() }).min(1);

module.exports = { createVendorType, updateVendorType, createMaterialCategory, updateMaterialCategory };
