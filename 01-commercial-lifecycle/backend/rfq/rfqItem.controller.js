'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../shared/backend/utils/response');
const rfqItemService = require('./rfqItem.service');

const listByRfq = asyncHandler(async (req, res) => {
  const items = await rfqItemService.listByRfq(req.params.rfqId, req.user);
  return success(res, { data: items });
});

const getTree = asyncHandler(async (req, res) => {
  const tree = await rfqItemService.getTree(req.params.rfqId, req.user);
  return success(res, { data: tree });
});

const getById = asyncHandler(async (req, res) => {
  const item = await rfqItemService.getById(req.params.id, req.user);
  return success(res, { data: item });
});

const createUnderRfq = asyncHandler(async (req, res) => {
  const item = await rfqItemService.create({ ...req.body, rfq_id: req.params.rfqId }, req.user);
  return created(res, item);
});

const update = asyncHandler(async (req, res) => {
  const item = await rfqItemService.update(req.params.id, req.body, req.user);
  return success(res, { data: item, message: 'RFQ item updated' });
});

const remove = asyncHandler(async (req, res) => {
  const item = await rfqItemService.remove(req.params.id, req.user);
  return success(res, { data: item, message: 'RFQ item deleted' });
});

module.exports = { listByRfq, getTree, getById, createUnderRfq, update, remove };
