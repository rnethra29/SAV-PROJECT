'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created, paginated } = require('../../../../shared/backend/utils/response');
const clmClientInvoiceService = require('../services/clmClientInvoice.service');

const list = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClientInvoiceService.list(req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const listByClient = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClientInvoiceService.listByClient(req.params.clientId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const invoice = await clmClientInvoiceService.getById(req.params.id, req.user);
  return success(res, { data: invoice });
});

const create = asyncHandler(async (req, res) => {
  const invoice = await clmClientInvoiceService.create(req.body, req.user);
  return created(res, invoice);
});

const createUnderClient = asyncHandler(async (req, res) => {
  const invoice = await clmClientInvoiceService.create({ ...req.body, client_id: req.params.clientId }, req.user);
  return created(res, invoice);
});

const update = asyncHandler(async (req, res) => {
  const invoice = await clmClientInvoiceService.update(req.params.id, req.body, req.user);
  return success(res, { data: invoice, message: 'Client invoice updated' });
});

const remove = asyncHandler(async (req, res) => {
  const invoice = await clmClientInvoiceService.remove(req.params.id, req.user);
  return success(res, { data: invoice, message: 'Client invoice deleted' });
});

module.exports = { list, listByClient, getById, create, createUnderClient, update, remove };
