'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../../shared/backend/utils/response');
const vndVendorInvoiceItemService = require('../services/vndVendorInvoiceItem.service');

const listByInvoice = asyncHandler(async (req, res) => {
  const lines = await vndVendorInvoiceItemService.listByInvoice(req.params.invoiceId, req.user);
  return success(res, { data: lines });
});

const getById = asyncHandler(async (req, res) => {
  const line = await vndVendorInvoiceItemService.getById(req.params.id, req.user);
  return success(res, { data: line });
});

const createUnderInvoice = asyncHandler(async (req, res) => {
  const line = await vndVendorInvoiceItemService.create({ ...req.body, vendor_invoice_id: req.params.invoiceId }, req.user);
  return created(res, line);
});

const update = asyncHandler(async (req, res) => {
  const line = await vndVendorInvoiceItemService.update(req.params.id, req.body, req.user);
  return success(res, { data: line, message: 'Vendor invoice line updated' });
});

const remove = asyncHandler(async (req, res) => {
  const line = await vndVendorInvoiceItemService.remove(req.params.id, req.user);
  return success(res, { data: line, message: 'Vendor invoice line deleted' });
});

module.exports = { listByInvoice, getById, createUnderInvoice, update, remove };
