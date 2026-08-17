'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../shared/backend/utils/response');
const marketPriceService = require('./marketPrice.service');

const listByRfqItem = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await marketPriceService.listByRfqItem(req.params.rfqItemId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const createForRfqItem = asyncHandler(async (req, res) => {
  const row = await marketPriceService.create({ ...req.body, rfq_item_id: req.params.rfqItemId }, req.user);
  return created(res, row);
});

module.exports = { listByRfqItem, createForRfqItem };
