'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const quotationItemService = require('../services/quotationItem.service');

const listByQuotation = asyncHandler(async (req, res) => {
  const items = await quotationItemService.listByQuotation(req.params.quotationId, req.user);
  return success(res, { data: items });
});

const getById = asyncHandler(async (req, res) => {
  const item = await quotationItemService.getById(req.params.id, req.user);
  return success(res, { data: item });
});

const createUnderQuotation = asyncHandler(async (req, res) => {
  const item = await quotationItemService.create({ ...req.body, quotation_id: req.params.quotationId }, req.user);
  return created(res, item);
});

const update = asyncHandler(async (req, res) => {
  const item = await quotationItemService.update(req.params.id, req.body, req.user);
  return success(res, { data: item, message: 'Quotation item updated' });
});

const remove = asyncHandler(async (req, res) => {
  const item = await quotationItemService.remove(req.params.id, req.user);
  return success(res, { data: item, message: 'Quotation item deleted' });
});

module.exports = { listByQuotation, getById, createUnderQuotation, update, remove };
