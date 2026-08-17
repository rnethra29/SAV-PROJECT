'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../../shared/backend/utils/response');
const clmProjectExpenseService = require('../services/clmProjectExpense.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmProjectExpenseService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const listByProject = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmProjectExpenseService.listByProject(req.params.projectId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const expense = await clmProjectExpenseService.getById(req.params.id, req.user);
  return success(res, { data: expense });
});

const createUnderProject = asyncHandler(async (req, res) => {
  const expense = await clmProjectExpenseService.create({ ...req.body, project_id: req.params.projectId }, req.user);
  return created(res, expense);
});

const update = asyncHandler(async (req, res) => {
  const expense = await clmProjectExpenseService.update(req.params.id, req.body, req.user);
  return success(res, { data: expense, message: 'Project expense updated' });
});

const decideApproval = asyncHandler(async (req, res) => {
  const expense = await clmProjectExpenseService.decideApproval(req.params.id, req.body, req.user);
  return success(res, { data: expense, message: `Expense ${req.body.status.toLowerCase()}` });
});

const remove = asyncHandler(async (req, res) => {
  const expense = await clmProjectExpenseService.remove(req.params.id, req.user);
  return success(res, { data: expense, message: 'Project expense deleted' });
});

module.exports = { list, listByProject, getById, createUnderProject, update, decideApproval, remove };
