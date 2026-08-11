'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const poService = require('../services/po.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await poService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const po = await poService.getById(req.params.id, req.user);
  return success(res, { data: po });
});

const create = asyncHandler(async (req, res) => {
  const po = await poService.create(req.body, req.user);
  return created(res, po);
});

const generateFromBoq = asyncHandler(async (req, res) => {
  const result = await poService.generateFromBoq(req.body, req.user);
  return created(res, result, 'PO generated from Final BOQ');
});

const update = asyncHandler(async (req, res) => {
  const po = await poService.update(req.params.id, req.body, req.user);
  return success(res, { data: po, message: 'PO updated' });
});

const remove = asyncHandler(async (req, res) => {
  const po = await poService.remove(req.params.id, req.user);
  return success(res, { data: po, message: 'PO deleted' });
});

module.exports = { list, getById, create, generateFromBoq, update, remove };
