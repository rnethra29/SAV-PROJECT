'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const vndVendorService = require('../services/vndVendor.service');
const vndAnalysisService = require('../services/vndAnalysis.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await vndVendorService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const vendor = await vndVendorService.getById(req.params.id, req.user);
  return success(res, { data: vendor });
});

const create = asyncHandler(async (req, res) => {
  const vendor = await vndVendorService.create(req.body, req.user);
  return created(res, vendor);
});

const update = asyncHandler(async (req, res) => {
  const vendor = await vndVendorService.update(req.params.id, req.body, req.user);
  return success(res, { data: vendor, message: 'Vendor updated' });
});

const remove = asyncHandler(async (req, res) => {
  const vendor = await vndVendorService.remove(req.params.id, req.user);
  return success(res, { data: vendor, message: 'Vendor deleted' });
});

const getPerformance = asyncHandler(async (req, res) => {
  const performance = await vndAnalysisService.vendorPerformance(req.params.vendorId, req.user);
  return success(res, { data: performance });
});

const getFinancialSummary = asyncHandler(async (req, res) => {
  const summary = await vndAnalysisService.vendorFinancialSummary(req.params.vendorId, req.user);
  return success(res, { data: summary });
});

module.exports = { list, getById, create, update, remove, getPerformance, getFinancialSummary };
