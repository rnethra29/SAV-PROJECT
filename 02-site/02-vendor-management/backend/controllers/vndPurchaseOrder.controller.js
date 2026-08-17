'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../../shared/backend/utils/response');
const vndPurchaseOrderService = require('../services/vndPurchaseOrder.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await vndPurchaseOrderService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.getById(req.params.id, req.user);
  return success(res, { data: po });
});

const create = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.create(req.body, req.user);
  return created(res, po);
});

const update = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.update(req.params.id, req.body, req.user);
  return success(res, { data: po, message: 'Purchase order updated' });
});

const submit = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.submit(req.params.id, req.user);
  return success(res, { data: po, message: 'Purchase order submitted for approval' });
});

const decideApprovalStage = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.decideApprovalStage(req.params.id, req.body.stage, req.user);
  return success(res, { data: po, message: `${req.body.stage} approval recorded` });
});

const receive = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.receive(req.params.id, req.body.items, req.user);
  return success(res, { data: po, message: 'Goods receipt recorded' });
});

const cancel = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.cancel(req.params.id, req.user);
  return success(res, { data: po, message: 'Purchase order cancelled' });
});

const remove = asyncHandler(async (req, res) => {
  const po = await vndPurchaseOrderService.remove(req.params.id, req.user);
  return success(res, { data: po, message: 'Purchase order deleted' });
});

module.exports = { list, getById, create, update, submit, decideApprovalStage, receive, cancel, remove };
