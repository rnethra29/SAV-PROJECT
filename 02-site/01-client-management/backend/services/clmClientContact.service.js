'use strict';

const clmClientContactRepository = require('../repositories/clmClientContact.repository');
const clmClientRepository = require('../repositories/clmClient.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

async function assertClientExists(clientId, user) {
  const clientRow = await clmClientRepository.findById(clientId, { companyId: user.companyId });
  if (!clientRow) throw ApiError.badRequest('client_id does not exist');
  return clientRow;
}

async function listByClient(clientId, user) {
  await assertClientExists(clientId, user);
  return clmClientContactRepository.findByClientId(clientId);
}

async function getById(id, user) {
  const contact = await clmClientContactRepository.findById(id, { companyId: user.companyId });
  if (!contact) throw ApiError.notFound('Client contact not found');
  return contact;
}

/** A client can have multiple "primary" contacts, one per department - scoped to (client_id, contact_type_id), not client-wide (doc §6.4). */
async function assertNoConflictingPrimary(clientId, contactTypeId, isPrimary, excludeContactId) {
  if (!isPrimary) return;
  const existing = await clmClientContactRepository.findPrimaryByType(clientId, contactTypeId, { excludeContactId });
  if (existing) {
    throw ApiError.conflict('This client already has a primary contact for this contact type - unset the existing one first', { code: 'UNIQUE_VIOLATION' });
  }
}

async function create(data, user) {
  await assertClientExists(data.client_id, user);
  await assertNoConflictingPrimary(data.client_id, data.contact_type_id, data.is_primary_contact);

  return transaction(async (client) => {
    const contact = await clmClientContactRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'ClientContact', entityId: contact.contact_id, action: 'Insert', userId: user.id, newValue: contact }, client);
    return contact;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.is_primary_contact) {
    const contactTypeId = data.contact_type_id || existing.contact_type_id;
    await assertNoConflictingPrimary(existing.client_id, contactTypeId, true, id);
  }

  return transaction(async (client) => {
    const updated = await clmClientContactRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Client contact not found');
    await auditService.log({ entityType: 'ClientContact', entityId: id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const deleted = await clmClientContactRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ClientContact', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByClient, getById, create, update, remove };
