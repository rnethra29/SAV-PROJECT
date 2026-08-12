'use strict';

const clmClientRequirementRepository = require('../repositories/clmClientRequirement.repository');
const clmClientRepository = require('../repositories/clmClient.repository');
const clmClientStatusHistoryRepository = require('../repositories/clmClientStatusHistory.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');
const { CLM_REQUIREMENT_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');

async function list(user, reqQuery) {
  return clmClientRequirementRepository.findAll({
    companyId: user.companyId,
    filters: { client_id: reqQuery.clientId, requirement_status: reqQuery.status, priority: reqQuery.priority },
    allowedSort: ['requirement_number', 'received_date', 'requirement_status', 'priority', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function listByClient(clientId, user, reqQuery) {
  const clientRow = await clmClientRepository.findById(clientId, { companyId: user.companyId });
  if (!clientRow) throw ApiError.notFound('Client not found');
  return list(user, { ...reqQuery, clientId });
}

async function getById(id, user) {
  const requirement = await clmClientRequirementRepository.findById(id, { companyId: user.companyId });
  if (!requirement) throw ApiError.notFound('Client requirement not found');
  return requirement;
}

async function create(data, user) {
  const clientRow = await clmClientRepository.findById(data.client_id, { companyId: user.companyId });
  if (!clientRow) throw ApiError.badRequest('client_id does not exist');

  const existing = await clmClientRequirementRepository.findByNumber(data.requirement_number, user.companyId);
  if (existing) throw ApiError.conflict(`Requirement number '${data.requirement_number}' already exists`);

  return transaction(async (client) => {
    const requirement = await clmClientRequirementRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'ClientRequirement', entityId: requirement.requirement_id, action: 'Insert', userId: user.id, newValue: requirement }, client);
    return requirement;
  });
}

/**
 * Requirement documents are attached via com_documents with entity_type='ClientRequirement'
 * (architecture doc §6.6 design note) - not a column on this table.
 */
async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.requirement_status && !isValidTransition(CLM_REQUIREMENT_TRANSITIONS, existing.requirement_status, data.requirement_status)) {
    throw ApiError.badRequest(`Invalid requirement status transition: '${existing.requirement_status}' -> '${data.requirement_status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  return transaction(async (client) => {
    const updated = await clmClientRequirementRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Client requirement not found');

    const statusChanged = data.requirement_status && data.requirement_status !== existing.requirement_status;
    if (statusChanged) {
      await clmClientStatusHistoryRepository.record(
        { entity_type: 'ClientRequirement', entity_id: id, old_status: existing.requirement_status, new_status: data.requirement_status, changed_by: user.id, remarks: data.statusChangeRemarks },
        client
      );
    }
    await auditService.log(
      { entityType: 'ClientRequirement', entityId: id, action: statusChanged ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const deleted = await clmClientRequirementRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ClientRequirement', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, listByClient, getById, create, update, remove };
