'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../shared/backend/utils/response');
const boqService = require('./boq.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await boqService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const boq = await boqService.getById(req.params.id, req.user);
  return success(res, { data: boq });
});

const getVersions = asyncHandler(async (req, res) => {
  const versions = await boqService.getVersions(req.params.boqNumber, req.user);
  return success(res, { data: versions });
});

const create = asyncHandler(async (req, res) => {
  const boq = await boqService.create(req.body, req.user);
  return created(res, boq);
});

const generateTentativeFromQuotation = asyncHandler(async (req, res) => {
  const result = await boqService.generateTentativeFromQuotation(req.body, req.user);
  return created(res, result, 'Tentative BOQ generated from settled quotation');
});

const createNewVersion = asyncHandler(async (req, res) => {
  const { cloneItems, ...data } = req.body;
  const boq = await boqService.createNewVersion(req.params.id, data, req.user, { cloneItems });
  return created(res, boq, 'New BOQ version created');
});

const update = asyncHandler(async (req, res) => {
  const boq = await boqService.update(req.params.id, req.body, req.user);
  return success(res, { data: boq, message: 'BOQ updated' });
});

const remove = asyncHandler(async (req, res) => {
  const boq = await boqService.remove(req.params.id, req.user);
  return success(res, { data: boq, message: 'BOQ deleted' });
});

module.exports = { list, getById, getVersions, create, generateTentativeFromQuotation, createNewVersion, update, remove };
