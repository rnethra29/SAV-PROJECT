'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/response');
const actualPriceService = require('../services/actualPrice.service');

const getCurrent = asyncHandler(async (req, res) => {
  const current = await actualPriceService.getCurrent(req.params.rfqItemId, req.user);
  return success(res, { data: current });
});

const getHistory = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await actualPriceService.getHistory(req.params.rfqItemId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const set = asyncHandler(async (req, res) => {
  const result = await actualPriceService.setActualPrice(req.params.rfqItemId, req.body, req.user);
  return success(res, { data: result, message: 'Actual price set', statusCode: 200 });
});

module.exports = { getCurrent, getHistory, set };
