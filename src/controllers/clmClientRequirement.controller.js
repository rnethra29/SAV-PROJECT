'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const clmClientRequirementService = require('../services/clmClientRequirement.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClientRequirementService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const listByClient = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClientRequirementService.listByClient(req.params.clientId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const requirement = await clmClientRequirementService.getById(req.params.id, req.user);
  return success(res, { data: requirement });
});

const create = asyncHandler(async (req, res) => {
  const requirement = await clmClientRequirementService.create(req.body, req.user);
  return created(res, requirement);
});

const createUnderClient = asyncHandler(async (req, res) => {
  const requirement = await clmClientRequirementService.create({ ...req.body, client_id: req.params.clientId }, req.user);
  return created(res, requirement);
});

const update = asyncHandler(async (req, res) => {
  const requirement = await clmClientRequirementService.update(req.params.id, req.body, req.user);
  return success(res, { data: requirement, message: 'Client requirement updated' });
});

const remove = asyncHandler(async (req, res) => {
  const requirement = await clmClientRequirementService.remove(req.params.id, req.user);
  return success(res, { data: requirement, message: 'Client requirement deleted' });
});

module.exports = { list, listByClient, getById, create, createUnderClient, update, remove };
