'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../../shared/backend/utils/response');
const clmClientService = require('../services/clmClient.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClientService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const clientRow = await clmClientService.getById(req.params.id, req.user);
  return success(res, { data: clientRow });
});

const create = asyncHandler(async (req, res) => {
  const clientRow = await clmClientService.create(req.body, req.user);
  return created(res, clientRow);
});

const update = asyncHandler(async (req, res) => {
  const clientRow = await clmClientService.update(req.params.id, req.body, req.user);
  return success(res, { data: clientRow, message: 'Client updated' });
});

const remove = asyncHandler(async (req, res) => {
  const clientRow = await clmClientService.remove(req.params.id, req.user);
  return success(res, { data: clientRow, message: 'Client deleted' });
});

module.exports = { list, getById, create, update, remove };
