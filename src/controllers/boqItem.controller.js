'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const boqItemService = require('../services/boqItem.service');

const listByBoq = asyncHandler(async (req, res) => {
  const items = await boqItemService.listByBoq(req.params.boqId, req.user);
  return success(res, { data: items });
});

const getTree = asyncHandler(async (req, res) => {
  const tree = await boqItemService.getTree(req.params.boqId, req.user);
  return success(res, { data: tree });
});

const getById = asyncHandler(async (req, res) => {
  const item = await boqItemService.getById(req.params.id, req.user);
  return success(res, { data: item });
});

const createUnderBoq = asyncHandler(async (req, res) => {
  const item = await boqItemService.create({ ...req.body, boq_id: req.params.boqId }, req.user);
  return created(res, item);
});

const update = asyncHandler(async (req, res) => {
  const item = await boqItemService.update(req.params.id, req.body, req.user);
  return success(res, { data: item, message: 'BOQ item updated' });
});

const remove = asyncHandler(async (req, res) => {
  const item = await boqItemService.remove(req.params.id, req.user);
  return success(res, { data: item, message: 'BOQ item deleted' });
});

module.exports = { listByBoq, getTree, getById, createUnderBoq, update, remove };
