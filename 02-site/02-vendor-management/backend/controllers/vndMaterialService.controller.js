'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../../shared/backend/utils/response');
const vndMaterialServiceService = require('../services/vndMaterialService.service');

const listByVendor = asyncHandler(async (req, res) => {
  const activeOnly = req.query.activeOnly !== 'false';
  const items = await vndMaterialServiceService.listByVendor(req.params.vendorId, req.user, { activeOnly });
  return success(res, { data: items });
});

const getById = asyncHandler(async (req, res) => {
  const item = await vndMaterialServiceService.getById(req.params.id, req.user);
  return success(res, { data: item });
});

const createUnderVendor = asyncHandler(async (req, res) => {
  const item = await vndMaterialServiceService.create({ ...req.body, vendor_id: req.params.vendorId }, req.user);
  return created(res, item);
});

const update = asyncHandler(async (req, res) => {
  const item = await vndMaterialServiceService.update(req.params.id, req.body, req.user);
  return success(res, { data: item, message: 'Catalog item updated' });
});

const deactivate = asyncHandler(async (req, res) => {
  const item = await vndMaterialServiceService.deactivate(req.params.id, req.user);
  return success(res, { data: item, message: 'Catalog item deactivated' });
});

module.exports = { listByVendor, getById, createUnderVendor, update, deactivate };
