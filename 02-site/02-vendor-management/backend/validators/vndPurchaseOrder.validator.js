'use strict';

const Joi = require('joi');
const { uuid } = require('../../../../shared/backend/validators/common.validator');
const { VND_PO_STATUS } = require('../../../../shared/backend/models/enums');

const createPurchaseOrder = Joi.object({
  po_number: Joi.string().max(50).required(),
  project_id: uuid.required(),
  vendor_id: uuid.required(),
  po_date: Joi.date().iso().required(),
  expected_delivery_date: Joi.date().iso().allow(null),
  delivery_location: Joi.string().max(255).allow('', null),
  payment_terms: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

const updatePurchaseOrder = Joi.object({
  po_date: Joi.date().iso(),
  expected_delivery_date: Joi.date().iso().allow(null),
  delivery_location: Joi.string().max(255).allow('', null),
  payment_terms: Joi.string().allow('', null),
  status: Joi.string().valid(...VND_PO_STATUS),
  remarks: Joi.string().allow('', null),
}).min(1);

const decideApprovalStage = Joi.object({
  stage: Joi.string().valid('Manager', 'Finance').required(),
});

const receivePoItems = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        poItemId: uuid.required(),
        receivedQuantity: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { createPurchaseOrder, updatePurchaseOrder, decideApprovalStage, receivePoItems };
