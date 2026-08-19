'use strict';

const vndMaterialServiceRepository = require('../repositories/vndMaterialService.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const auditService = require('../services/audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

async function assertVendorExists(vendorId, user) {
  const vendor = await vndVendorRepository.findById(vendorId, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');
  return vendor;
}

async function listByVendor(vendorId, user, { activeOnly = true } = {}) {
  await assertVendorExists(vendorId, user);
  return vndMaterialServiceRepository.findByVendorId(vendorId, { activeOnly });
}

async function getById(id, user) {
  const item = await vndMaterialServiceRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('Material/service catalog item not found');
  return item;
}

async function create(data, user) {
  await assertVendorExists(data.vendor_id, user);
  return transaction(async (client) => {
    const item = await vndMaterialServiceRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Vendor', entityId: data.vendor_id, action: 'Insert', userId: user.id, newValue: { material_service_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const updated = await vndMaterialServiceRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Material/service catalog item not found');
    await auditService.log({ entityType: 'Vendor', entityId: existing.vendor_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

/** No deleted_at column (doc §6.9) - deactivate via is_active rather than delete. */
async function deactivate(id, user) {
  return update(id, { is_active: false }, user);
}

module.exports = { listByVendor, getById, create, update, deactivate };
