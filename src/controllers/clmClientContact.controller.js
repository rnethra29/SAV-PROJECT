'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const clmClientContactService = require('../services/clmClientContact.service');

const listByClient = asyncHandler(async (req, res) => {
  const contacts = await clmClientContactService.listByClient(req.params.clientId, req.user);
  return success(res, { data: contacts });
});

const getById = asyncHandler(async (req, res) => {
  const contact = await clmClientContactService.getById(req.params.id, req.user);
  return success(res, { data: contact });
});

const createUnderClient = asyncHandler(async (req, res) => {
  const contact = await clmClientContactService.create({ ...req.body, client_id: req.params.clientId }, req.user);
  return created(res, contact);
});

const update = asyncHandler(async (req, res) => {
  const contact = await clmClientContactService.update(req.params.id, req.body, req.user);
  return success(res, { data: contact, message: 'Client contact updated' });
});

const remove = asyncHandler(async (req, res) => {
  const contact = await clmClientContactService.remove(req.params.id, req.user);
  return success(res, { data: contact, message: 'Client contact deleted' });
});

module.exports = { listByClient, getById, createUnderClient, update, remove };
