'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../shared/backend/utils/response');
const estimationService = require('./estimation.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await estimationService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const estimation = await estimationService.getById(req.params.id, req.user);
  return success(res, { data: estimation });
});

const create = asyncHandler(async (req, res) => {
  const estimation = await estimationService.create(req.body, req.user);
  return created(res, estimation);
});

const update = asyncHandler(async (req, res) => {
  const estimation = await estimationService.update(req.params.id, req.body, req.user);
  return success(res, { data: estimation, message: 'Estimation updated' });
});

const remove = asyncHandler(async (req, res) => {
  const estimation = await estimationService.remove(req.params.id, req.user);
  return success(res, { data: estimation, message: 'Estimation deleted' });
});

module.exports = { list, getById, create, update, remove };
