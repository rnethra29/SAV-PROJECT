'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../shared/backend/utils/response');
const estimationItemService = require('./estimationItem.service');

const listByEstimation = asyncHandler(async (req, res) => {
  const items = await estimationItemService.listByEstimation(req.params.estimationId, req.user);
  return success(res, { data: items });
});

const getById = asyncHandler(async (req, res) => {
  const item = await estimationItemService.getById(req.params.id, req.user);
  return success(res, { data: item });
});

const getCostBreakup = asyncHandler(async (req, res) => {
  const breakup = await estimationItemService.getCostBreakup(req.params.id, req.user);
  return success(res, { data: breakup });
});

const createUnderEstimation = asyncHandler(async (req, res) => {
  const item = await estimationItemService.create({ ...req.body, estimation_id: req.params.estimationId }, req.user);
  return created(res, item);
});

const update = asyncHandler(async (req, res) => {
  const item = await estimationItemService.update(req.params.id, req.body, req.user);
  return success(res, { data: item, message: 'Estimation item updated' });
});

const remove = asyncHandler(async (req, res) => {
  const item = await estimationItemService.remove(req.params.id, req.user);
  return success(res, { data: item, message: 'Estimation item deleted' });
});

module.exports = { listByEstimation, getById, getCostBreakup, createUnderEstimation, update, remove };
