'use strict';

const Joi = require('joi');
const { uuid } = require('../../validators/common.validator');
const { APPROVAL_ENTITY_TYPE } = require('../../models/enums');

const requestApproval = Joi.object({
  entity_type: Joi.string().valid(...APPROVAL_ENTITY_TYPE).required(),
  entity_id: uuid.required(),
  approval_stage: Joi.string().max(50).required(),
  approver_id: uuid.required(),
  comments: Joi.string().allow('', null),
});

const approveDecision = Joi.object({
  comments: Joi.string().allow('', null),
});

const rejectDecision = Joi.object({
  comments: Joi.string().allow('', null),
  rejectionReason: Joi.string().required(),
});

const entityParams = Joi.object({
  entityType: Joi.string().valid(...APPROVAL_ENTITY_TYPE).required(),
  entityId: uuid.required(),
});

module.exports = { requestApproval, approveDecision, rejectDecision, entityParams };
