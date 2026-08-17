'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../../shared/backend/utils/response');
const vndVendorRatingService = require('../services/vndVendorRating.service');

const listByVendor = asyncHandler(async (req, res) => {
  const ratings = await vndVendorRatingService.listByVendor(req.params.vendorId, req.user);
  return success(res, { data: ratings });
});

const createUnderVendor = asyncHandler(async (req, res) => {
  const rating = await vndVendorRatingService.create({ ...req.body, vendor_id: req.params.vendorId }, req.user);
  return created(res, rating);
});

module.exports = { listByVendor, createUnderVendor };
