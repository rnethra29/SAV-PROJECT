'use strict';

const Joi = require('joi');

const createItemCategory = Joi.object({
  category_name: Joi.string().max(100).required(),
  sequence_no: Joi.number().integer().min(0).required(),
  is_active: Joi.boolean().default(true),
});

const createSimpleLookup = (nameField) =>
  Joi.object({
    [nameField]: Joi.string().max(100).required(),
    is_active: Joi.boolean().default(true),
  });

const updateItemCategory = Joi.object({
  category_name: Joi.string().max(100),
  sequence_no: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
}).min(1);

const updateSimpleLookup = (nameField) =>
  Joi.object({
    [nameField]: Joi.string().max(100),
    is_active: Joi.boolean(),
  }).min(1);

module.exports = {
  createItemCategory,
  updateItemCategory,
  createPriceSourceType: createSimpleLookup('source_name'),
  updatePriceSourceType: updateSimpleLookup('source_name'),
  createDocumentCategory: createSimpleLookup('category_name'),
  updateDocumentCategory: updateSimpleLookup('category_name'),
};
