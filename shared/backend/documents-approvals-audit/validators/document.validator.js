'use strict';

const Joi = require('joi');
const { uuid } = require('../../validators/common.validator');
const { DOCUMENT_ENTITY_TYPE } = require('../../models/enums');

const uploadDocument = Joi.object({
  entityType: Joi.string().valid(...DOCUMENT_ENTITY_TYPE).required(),
  entityId: uuid.required(),
  documentCategoryId: uuid.required(),
  description: Joi.string().allow('', null),
  previousVersionId: uuid.optional(),
});

const entityQuery = Joi.object({
  entityType: Joi.string().valid(...DOCUMENT_ENTITY_TYPE).required(),
  entityId: uuid.required(),
  activeOnly: Joi.boolean().default(true),
}).unknown(true);

module.exports = { uploadDocument, entityQuery };
