'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../../shared/backend/utils/response');
const clmPaymentService = require('../services/clmPayment.service');
const clmPaymentAllocationService = require('../services/clmPaymentAllocation.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmPaymentService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const listByClient = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmPaymentService.listByClient(req.params.clientId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const payment = await clmPaymentService.getById(req.params.id, req.user);
  return success(res, { data: payment });
});

const create = asyncHandler(async (req, res) => {
  const payment = await clmPaymentService.create(req.body, req.user);
  return created(res, payment);
});

const createUnderClient = asyncHandler(async (req, res) => {
  const payment = await clmPaymentService.create({ ...req.body, client_id: req.params.clientId }, req.user);
  return created(res, payment);
});

const update = asyncHandler(async (req, res) => {
  const payment = await clmPaymentService.update(req.params.id, req.body, req.user);
  return success(res, { data: payment, message: 'Payment updated' });
});

const decideVerification = asyncHandler(async (req, res) => {
  const payment = await clmPaymentService.decideVerification(req.params.id, req.body, req.user);
  return success(res, { data: payment, message: `Payment ${req.body.status.toLowerCase()}` });
});

const remove = asyncHandler(async (req, res) => {
  const payment = await clmPaymentService.remove(req.params.id, req.user);
  return success(res, { data: payment, message: 'Payment deleted' });
});

const listAllocations = asyncHandler(async (req, res) => {
  const allocations = await clmPaymentAllocationService.listByPayment(req.params.paymentId, req.user);
  return success(res, { data: allocations });
});

const createAllocation = asyncHandler(async (req, res) => {
  const allocation = await clmPaymentAllocationService.create({ ...req.body, payment_id: req.params.paymentId }, req.user);
  return created(res, allocation);
});

module.exports = { list, listByClient, getById, create, createUnderClient, update, decideVerification, remove, listAllocations, createAllocation };
