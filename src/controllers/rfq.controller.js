'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const rfqService = require('../services/rfq.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await rfqService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const rfq = await rfqService.getById(req.params.id, req.user);
  return success(res, { data: rfq });
});

const create = asyncHandler(async (req, res) => {
  const rfq = await rfqService.create(req.body, req.user);
  return created(res, rfq);
});

const update = asyncHandler(async (req, res) => {
  const rfq = await rfqService.update(req.params.id, req.body, req.user);
  return success(res, { data: rfq, message: 'RFQ updated' });
});

const remove = asyncHandler(async (req, res) => {
  const rfq = await rfqService.remove(req.params.id, req.user);
  return success(res, { data: rfq, message: 'RFQ deleted' });
});

module.exports = { list, getById, create, update, remove };
