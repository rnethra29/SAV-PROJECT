'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const clmProjectService = require('../services/clmProject.service');
const vndAnalysisService = require('../services/vndAnalysis.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmProjectService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const project = await clmProjectService.getById(req.params.id, req.user);
  return success(res, { data: project });
});

const create = asyncHandler(async (req, res) => {
  const project = await clmProjectService.create(req.body, req.user);
  return created(res, project);
});

const update = asyncHandler(async (req, res) => {
  const project = await clmProjectService.update(req.params.id, req.body, req.user);
  return success(res, { data: project, message: 'Project updated' });
});

const remove = asyncHandler(async (req, res) => {
  const project = await clmProjectService.remove(req.params.id, req.user);
  return success(res, { data: project, message: 'Project deleted' });
});

const getFinancialSummary = asyncHandler(async (req, res) => {
  const summary = await vndAnalysisService.projectFinancialSummary(req.params.projectId, req.user);
  return success(res, { data: summary });
});

const getCostSummary = asyncHandler(async (req, res) => {
  const summary = await vndAnalysisService.projectCostSummary(req.params.projectId, req.user);
  return success(res, { data: summary });
});

const listFinancialSummaries = asyncHandler(async (req, res) => {
  const rows = await vndAnalysisService.projectFinancialSummaryList(req.user);
  return success(res, { data: rows });
});

module.exports = { list, getById, create, update, remove, getFinancialSummary, getCostSummary, listFinancialSummaries };
