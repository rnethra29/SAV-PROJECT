'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../../shared/backend/utils/response');
const vndVendorInvoiceService = require('../services/vndVendorInvoice.service');
const vndAnalysisService = require('../services/vndAnalysis.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await vndVendorInvoiceService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const invoice = await vndVendorInvoiceService.getById(req.params.id, req.user);
  return success(res, { data: invoice });
});

const create = asyncHandler(async (req, res) => {
  const invoice = await vndVendorInvoiceService.create(req.body, req.user);
  return created(res, invoice);
});

const update = asyncHandler(async (req, res) => {
  const invoice = await vndVendorInvoiceService.update(req.params.id, req.body, req.user);
  return success(res, { data: invoice, message: 'Vendor invoice updated' });
});

const verify = asyncHandler(async (req, res) => {
  const invoice = await vndVendorInvoiceService.verify(req.params.id, req.user);
  return success(res, { data: invoice, message: 'Vendor invoice verified' });
});

const remove = asyncHandler(async (req, res) => {
  const invoice = await vndVendorInvoiceService.remove(req.params.id, req.user);
  return success(res, { data: invoice, message: 'Vendor invoice deleted' });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await vndAnalysisService.vendorInvoiceSummary(req.params.id, req.user);
  return success(res, { data: summary });
});

module.exports = { list, getById, create, update, verify, remove, getSummary };
