'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../../shared/backend/utils/response');
const clmClientInvoiceLineService = require('../services/clmClientInvoiceLine.service');

const listByInvoice = asyncHandler(async (req, res) => {
  const lines = await clmClientInvoiceLineService.listByInvoice(req.params.invoiceId, req.user);
  return success(res, { data: lines });
});

const getById = asyncHandler(async (req, res) => {
  const line = await clmClientInvoiceLineService.getById(req.params.id, req.user);
  return success(res, { data: line });
});

const createUnderInvoice = asyncHandler(async (req, res) => {
  const line = await clmClientInvoiceLineService.create({ ...req.body, invoice_id: req.params.invoiceId }, req.user);
  return created(res, line);
});

const update = asyncHandler(async (req, res) => {
  const line = await clmClientInvoiceLineService.update(req.params.id, req.body, req.user);
  return success(res, { data: line, message: 'Invoice line updated' });
});

const remove = asyncHandler(async (req, res) => {
  const line = await clmClientInvoiceLineService.remove(req.params.id, req.user);
  return success(res, { data: line, message: 'Invoice line deleted' });
});

module.exports = { listByInvoice, getById, createUnderInvoice, update, remove };
