'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated } = require('../utils/response');
const negotiationService = require('../services/negotiation.service');

const listByQuotation = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await negotiationService.listByQuotation(req.params.quotationId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const listByQuotationItem = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await negotiationService.listByQuotationItem(req.params.quotationItemId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getFinal = asyncHandler(async (req, res) => {
  const final = await negotiationService.getFinal(req.params.quotationItemId, req.user);
  return success(res, { data: final });
});

const create = asyncHandler(async (req, res) => {
  const offer = await negotiationService.create(req.body, req.user);
  return created(res, offer, 'Offer recorded');
});

module.exports = { listByQuotation, listByQuotationItem, getFinal, create };
