'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../../shared/backend/utils/response');
const clmProjectCostService = require('../services/clmProjectCost.service');

const listByProject = asyncHandler(async (req, res) => {
  const rows = await clmProjectCostService.listByProject(req.params.projectId, req.user);
  return success(res, { data: rows });
});

const getById = asyncHandler(async (req, res) => {
  const row = await clmProjectCostService.getById(req.params.id, req.user);
  return success(res, { data: row });
});

const createUnderProject = asyncHandler(async (req, res) => {
  const row = await clmProjectCostService.create({ ...req.body, project_id: req.params.projectId }, req.user);
  return created(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await clmProjectCostService.update(req.params.id, req.body, req.user);
  return success(res, { data: row, message: 'Project cost plan row updated' });
});

module.exports = { listByProject, getById, createUnderProject, update };
