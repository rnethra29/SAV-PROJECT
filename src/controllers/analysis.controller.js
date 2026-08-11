'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/response');
const analysisService = require('../services/analysis.service');

const itemCommercialAnalysis = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await analysisService.itemCommercialAnalysis(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const itemCommercialAnalysisFinal = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await analysisService.itemCommercialAnalysisFinal(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const estimationItemCost = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await analysisService.estimationItemCost(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const byRfqItem = asyncHandler(async (req, res) => {
  const row = await analysisService.itemCommercialAnalysisByRfqItem(req.params.rfqItemId, req.user);
  return success(res, { data: row });
});

module.exports = { itemCommercialAnalysis, itemCommercialAnalysisFinal, estimationItemCost, byRfqItem };
