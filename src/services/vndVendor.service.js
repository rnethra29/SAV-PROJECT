'use strict';

const vndVendorRepository = require('../repositories/vndVendor.repository');
const vndVendorContactRepository = require('../repositories/vndVendorContact.repository');
const auditService = require('../services/audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');
const { VND_VENDOR_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');

async function list(user, reqQuery) {
  return vndVendorRepository.findAll({
    companyId: user.companyId,
    filters: { vendor_status: reqQuery.status, vendor_type_id: reqQuery.vendorTypeId },
    allowedSort: ['vendor_code', 'vendor_name', 'vendor_status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const vendor = await vndVendorRepository.findById(id, { companyId: user.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vendor;
}

async function create(data, user) {
  const existingCode = await vndVendorRepository.findByCode(data.vendor_code, user.companyId);
  if (existingCode) throw ApiError.conflict(`Vendor code '${data.vendor_code}' already exists`);

  if (data.gst_number) {
    const existingGst = await vndVendorRepository.findByGst(data.gst_number, user.companyId);
    if (existingGst) throw ApiError.conflict(`GST number '${data.gst_number}' is already registered to another vendor`, { code: 'UNIQUE_VIOLATION' });
  }

  return transaction(async (client) => {
    const vendor = await vndVendorRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Vendor', entityId: vendor.vendor_id, action: 'Insert', userId: user.id, newValue: vendor }, client);
    return vendor;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.vendor_status && !isValidTransition(VND_VENDOR_TRANSITIONS, existing.vendor_status, data.vendor_status)) {
    throw ApiError.badRequest(`Invalid vendor status transition: '${existing.vendor_status}' -> '${data.vendor_status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  if (data.gst_number && data.gst_number !== existing.gst_number) {
    const existingGst = await vndVendorRepository.findByGst(data.gst_number, user.companyId);
    if (existingGst) throw ApiError.conflict(`GST number '${data.gst_number}' is already registered to another vendor`, { code: 'UNIQUE_VIOLATION' });
  }

  return transaction(async (client) => {
    const updated = await vndVendorRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Vendor not found');
    await auditService.log(
      { entityType: 'Vendor', entityId: id, action: data.vendor_status && data.vendor_status !== existing.vendor_status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const contacts = await vndVendorContactRepository.findByVendorId(id);
  if (contacts.length) throw ApiError.conflict('Cannot delete a vendor that still has contacts on record - remove them first', { code: 'HAS_DEPENDENTS' });

  const dependentResult = await query(
    `SELECT
       (SELECT COUNT(*) FROM vnd_purchase_order WHERE vendor_id = $1 AND deleted_at IS NULL) AS purchase_orders,
       (SELECT COUNT(*) FROM vnd_vendor_invoice WHERE vendor_id = $1 AND deleted_at IS NULL) AS invoices,
       (SELECT COUNT(*) FROM vnd_vendor_payment WHERE vendor_id = $1) AS payments`,
    [id]
  );
  const { purchase_orders, invoices, payments } = dependentResult.rows[0];
  if (Number(purchase_orders) || Number(invoices) || Number(payments)) {
    throw ApiError.conflict('Cannot delete a vendor with purchase orders, invoices, or payments on record', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await vndVendorRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Vendor', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, remove };
