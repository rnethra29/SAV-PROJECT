'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../shared/backend/utils/response');
const poItemService = require('./poItem.service');

const listByPo = asyncHandler(async (req, res) => {
  const items = await poItemService.listByPo(req.params.poId, req.user);
  return success(res, { data: items });
});

const getById = asyncHandler(async (req, res) => {
  const item = await poItemService.getById(req.params.id, req.user);
  return success(res, { data: item });
});

const createUnderPo = asyncHandler(async (req, res) => {
  const item = await poItemService.create({ ...req.body, po_id: req.params.poId }, req.user);
  return created(res, item);
});

const update = asyncHandler(async (req, res) => {
  const item = await poItemService.update(req.params.id, req.body, req.user);
  return success(res, { data: item, message: 'PO item updated' });
});

const remove = asyncHandler(async (req, res) => {
  const item = await poItemService.remove(req.params.id, req.user);
  return success(res, { data: item, message: 'PO item deleted' });
});

module.exports = { listByPo, getById, createUnderPo, update, remove };
