'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const vndVendorContactService = require('../services/vndVendorContact.service');

const listByVendor = asyncHandler(async (req, res) => {
  const contacts = await vndVendorContactService.listByVendor(req.params.vendorId, req.user);
  return success(res, { data: contacts });
});

const getById = asyncHandler(async (req, res) => {
  const contact = await vndVendorContactService.getById(req.params.id, req.user);
  return success(res, { data: contact });
});

const createUnderVendor = asyncHandler(async (req, res) => {
  const contact = await vndVendorContactService.create({ ...req.body, vendor_id: req.params.vendorId }, req.user);
  return created(res, contact);
});

const update = asyncHandler(async (req, res) => {
  const contact = await vndVendorContactService.update(req.params.id, req.body, req.user);
  return success(res, { data: contact, message: 'Vendor contact updated' });
});

const remove = asyncHandler(async (req, res) => {
  const contact = await vndVendorContactService.remove(req.params.id, req.user);
  return success(res, { data: contact, message: 'Vendor contact deleted' });
});

module.exports = { listByVendor, getById, createUnderVendor, update, remove };
