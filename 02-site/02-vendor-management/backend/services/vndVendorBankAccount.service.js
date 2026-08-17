'use strict';

const vndVendorBankAccountRepository = require('../repositories/vndVendorBankAccount.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

async function assertVendorExists(vendorId, user) {
  const vendor = await vndVendorRepository.findById(vendorId, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');
  return vendor;
}

/**
 * Masks the sensitive fields (doc §20: "mask in all list/summary API
 * responses - show last 4 digits only; full value retrievable only via a
 * dedicated, separately-permissioned endpoint"). `reveal()` below is that
 * dedicated endpoint's service method.
 */
function mask(bankAccount) {
  if (!bankAccount) return bankAccount;
  const maskTail = (value) => (value ? `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}` : value);
  return { ...bankAccount, account_number: maskTail(bankAccount.account_number), upi_id: bankAccount.upi_id ? maskTail(bankAccount.upi_id) : bankAccount.upi_id };
}

async function listByVendor(vendorId, user) {
  await assertVendorExists(vendorId, user);
  const rows = await vndVendorBankAccountRepository.findByVendorId(vendorId);
  return rows.map(mask);
}

async function getById(id, user) {
  const account = await vndVendorBankAccountRepository.findById(id, { companyId: user.companyId });
  if (!account) throw ApiError.notFound('Vendor bank account not found');
  return account;
}

async function getByIdMasked(id, user) {
  return mask(await getById(id, user));
}

/** Every reveal is written to com_audit_log with action='Download' (doc §20). */
async function reveal(id, user) {
  const account = await getById(id, user);
  await auditService.log({ entityType: 'Vendor', entityId: account.vendor_id, action: 'Download', userId: user.id, newValue: { bank_account_revealed: id } });
  return account;
}

async function assertNoConflictingPrimary(vendorId, isPrimary, excludeBankAccountId) {
  if (!isPrimary) return;
  const existing = await vndVendorBankAccountRepository.findPrimary(vendorId, { excludeBankAccountId });
  if (existing) throw ApiError.conflict('This vendor already has a primary bank account - unset the existing one first', { code: 'UNIQUE_VIOLATION' });
}

async function create(data, user) {
  await assertVendorExists(data.vendor_id, user);
  await assertNoConflictingPrimary(data.vendor_id, data.is_primary ?? true);

  return transaction(async (client) => {
    const account = await vndVendorBankAccountRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Vendor', entityId: data.vendor_id, action: 'Insert', userId: user.id, newValue: { bank_account_created: account.bank_account_id } }, client);
    return mask(account);
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  if (data.is_primary) await assertNoConflictingPrimary(existing.vendor_id, true, id);

  return transaction(async (client) => {
    const updated = await vndVendorBankAccountRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Vendor bank account not found');
    await auditService.log({ entityType: 'Vendor', entityId: existing.vendor_id, action: 'Update', userId: user.id, newValue: { bank_account_updated: id } }, client);
    return mask(updated);
  });
}

/** Marks the account verified (doc §6.8: "set true after a penny-drop/manual verification step"). */
async function verify(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const updated = await vndVendorBankAccountRepository.update(
      id,
      { is_verified: true, verified_by: user.id, verified_at: new Date() },
      { companyId: user.companyId, userId: user.id, client }
    );
    await auditService.log({ entityType: 'Vendor', entityId: existing.vendor_id, action: 'Approve', userId: user.id, newValue: { bank_account_verified: id } }, client);
    return mask(updated);
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const deleted = await vndVendorBankAccountRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Vendor', entityId: existing.vendor_id, action: 'Delete', userId: user.id, newValue: { bank_account_deleted: id } }, client);
    return mask(deleted);
  });
}

module.exports = { listByVendor, getById: getByIdMasked, reveal, create, update, verify, remove, mask };
