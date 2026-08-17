'use strict';

const vndVendorContactRepository = require('../repositories/vndVendorContact.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const auditService = require('../services/audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

async function assertVendorExists(vendorId, user) {
  const vendor = await vndVendorRepository.findById(vendorId, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');
  return vendor;
}

async function listByVendor(vendorId, user) {
  await assertVendorExists(vendorId, user);
  return vndVendorContactRepository.findByVendorId(vendorId);
}

async function getById(id, user) {
  const contact = await vndVendorContactRepository.findById(id, { companyId: user.companyId });
  if (!contact) throw ApiError.notFound('Vendor contact not found');
  return contact;
}

/** Exactly one primary contact per vendor (doc §6.7) - unlike Client Management's per-department scoping. */
async function assertNoConflictingPrimary(vendorId, isPrimary, excludeContactId) {
  if (!isPrimary) return;
  const existing = await vndVendorContactRepository.findPrimary(vendorId, { excludeContactId });
  if (existing) throw ApiError.conflict('This vendor already has a primary contact - unset the existing one first', { code: 'UNIQUE_VIOLATION' });
}

async function create(data, user) {
  await assertVendorExists(data.vendor_id, user);
  await assertNoConflictingPrimary(data.vendor_id, data.is_primary_contact);

  return transaction(async (client) => {
    const contact = await vndVendorContactRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'VendorContact', entityId: contact.vendor_contact_id, action: 'Insert', userId: user.id, newValue: contact }, client);
    return contact;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  if (data.is_primary_contact) await assertNoConflictingPrimary(existing.vendor_id, true, id);

  return transaction(async (client) => {
    const updated = await vndVendorContactRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Vendor contact not found');
    await auditService.log({ entityType: 'VendorContact', entityId: id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const deleted = await vndVendorContactRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'VendorContact', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByVendor, getById, create, update, remove };
