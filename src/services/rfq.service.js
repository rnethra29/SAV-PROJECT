'use strict';

const rfqRepository = require('../repositories/rfq.repository');
const rfqItemRepository = require('../repositories/rfqItem.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');
const { RFQ_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');

async function list(user, reqQuery) {
  return rfqRepository.findAll({
    companyId: user.companyId,
    filters: { status: reqQuery.status, client_id: reqQuery.clientId, project_id: reqQuery.projectId },
    allowedSort: ['rfq_number', 'rfq_date', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const rfq = await rfqRepository.findById(id, { companyId: user.companyId });
  if (!rfq) throw ApiError.notFound('RFQ not found');
  return rfq;
}

async function create(data, user) {
  const existing = await rfqRepository.findByNumber(data.rfq_number, user.companyId);
  if (existing) throw ApiError.conflict(`RFQ number '${data.rfq_number}' already exists`);

  return transaction(async (client) => {
    const rfq = await rfqRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'RFQ', entityId: rfq.rfq_id, action: 'Insert', userId: user.id, newValue: rfq }, client);
    return rfq;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.status && !isValidTransition(RFQ_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid RFQ status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  return transaction(async (client) => {
    const updated = await rfqRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('RFQ not found');
    await auditService.log(
      { entityType: 'RFQ', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const items = await rfqItemRepository.findByRfqId(id);
  if (items.length) {
    throw ApiError.conflict('Cannot delete an RFQ that still has RFQ items - remove/reassign items first', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await rfqRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'RFQ', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, remove };
