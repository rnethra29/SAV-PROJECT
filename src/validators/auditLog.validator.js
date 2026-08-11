'use strict';

const Joi = require('joi');
const { uuid } = require('./common.validator');
const { DOCUMENT_ENTITY_TYPE, APPROVAL_ENTITY_TYPE } = require('../models/enums');

// Audit log's entity_type is a free VARCHAR(50) in the DDL (not a DB enum),
// but in practice it is always one of the entity kinds this module writes -
// union of the document/approval entity type sets covers all of them.
const AUDIT_ENTITY_TYPES = Array.from(new Set([...DOCUMENT_ENTITY_TYPE, ...APPROVAL_ENTITY_TYPE]));

const entityParams = Joi.object({
  entityType: Joi.string().valid(...AUDIT_ENTITY_TYPES).required(),
  entityId: uuid.required(),
});

module.exports = { entityParams };
