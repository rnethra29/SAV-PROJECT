'use strict';

const vndVendorRatingRepository = require('../repositories/vndVendorRating.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const vndPurchaseOrderRepository = require('../repositories/vndPurchaseOrder.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

async function listByVendor(vendorId, user) {
  const vendor = await vndVendorRepository.findById(vendorId, { companyId: user.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vndVendorRatingRepository.findByVendorId(vendorId);
}

/** Append-only (doc §6.10) - a rating is a point-in-time opinion, corrected by submitting a new rating, never edited in place. */
async function create(data, user) {
  const vendor = await vndVendorRepository.findById(data.vendor_id, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');

  if (data.purchase_order_id) {
    const po = await vndPurchaseOrderRepository.findById(data.purchase_order_id, { companyId: user.companyId });
    if (!po) throw ApiError.badRequest('purchase_order_id does not exist');
  }

  return transaction(async (client) => {
    const rating = await vndVendorRatingRepository.create(
      { ...data, rated_by: user.id, created_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Vendor', entityId: data.vendor_id, action: 'Insert', userId: user.id, newValue: { rating_created: rating } }, client);
    return rating;
  });
}

module.exports = { listByVendor, create };
