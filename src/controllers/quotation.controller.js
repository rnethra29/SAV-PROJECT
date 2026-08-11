'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const quotationService = require('../services/quotation.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await quotationService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const quotation = await quotationService.getById(req.params.id, req.user);
  return success(res, { data: quotation });
});

const getVersions = asyncHandler(async (req, res) => {
  const versions = await quotationService.getVersions(req.params.quotationNumber, req.user);
  return success(res, { data: versions });
});

const create = asyncHandler(async (req, res) => {
  const quotation = await quotationService.create(req.body, req.user);
  return created(res, quotation);
});

const createNewVersion = asyncHandler(async (req, res) => {
  const { cloneItems, ...data } = req.body;
  const quotation = await quotationService.createNewVersion(req.params.id, data, req.user, { cloneItems });
  return created(res, quotation, 'New quotation version created');
});

const update = asyncHandler(async (req, res) => {
  const quotation = await quotationService.update(req.params.id, req.body, req.user);
  return success(res, { data: quotation, message: 'Quotation updated' });
});

const remove = asyncHandler(async (req, res) => {
  const quotation = await quotationService.remove(req.params.id, req.user);
  return success(res, { data: quotation, message: 'Quotation deleted' });
});

module.exports = { list, getById, getVersions, create, createNewVersion, update, remove };
