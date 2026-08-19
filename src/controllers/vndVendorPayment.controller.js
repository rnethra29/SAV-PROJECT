'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const vndVendorPaymentService = require('../services/vndVendorPayment.service');
const vndVendorPaymentAllocationService = require('../services/vndVendorPaymentAllocation.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await vndVendorPaymentService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const payment = await vndVendorPaymentService.getById(req.params.id, req.user);
  return success(res, { data: payment });
});

const create = asyncHandler(async (req, res) => {
  const payment = await vndVendorPaymentService.create(req.body, req.user);
  return created(res, payment);
});

const update = asyncHandler(async (req, res) => {
  const payment = await vndVendorPaymentService.update(req.params.id, req.body, req.user);
  return success(res, { data: payment, message: 'Vendor payment updated' });
});

const approve = asyncHandler(async (req, res) => {
  const payment = await vndVendorPaymentService.approve(req.params.id, req.user);
  return success(res, { data: payment, message: 'Vendor payment approved' });
});

const decideStatus = asyncHandler(async (req, res) => {
  const payment = await vndVendorPaymentService.decideStatus(req.params.id, req.body.status, req.user);
  return success(res, { data: payment, message: `Vendor payment marked ${req.body.status}` });
});

const listAllocations = asyncHandler(async (req, res) => {
  const allocations = await vndVendorPaymentAllocationService.listByPayment(req.params.paymentId, req.user);
  return success(res, { data: allocations });
});

const createAllocation = asyncHandler(async (req, res) => {
  const allocation = await vndVendorPaymentAllocationService.create({ ...req.body, vendor_payment_id: req.params.paymentId }, req.user);
  return created(res, allocation);
});

module.exports = { list, getById, create, update, approve, decideStatus, listAllocations, createAllocation };
