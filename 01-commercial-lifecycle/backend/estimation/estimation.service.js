'use strict';

const estimationRepository = require('./estimation.repository');
const estimationItemRepository = require('./estimationItem.repository');
const rfqRepository = require('../rfq/rfq.repository');
const auditService = require('../../../shared/backend/documents-approvals-audit/services/audit.service');
const approvalService = require('../../../shared/backend/documents-approvals-audit/services/approval.service');
const ApiError = require('../../../shared/backend/utils/apiError');
const { transaction } = require('../../../shared/backend/config/database');
const { ESTIMATION_TRANSITIONS, isValidTransition } = require('../../../shared/backend/models/statusTransitions');
const { APPROVAL_STAGES } = require('../../../shared/backend/models/approvalStages');

async function list(user, reqQuery) {
  return estimationRepository.findAll({
    companyId: user.companyId,
    filters: { rfq_id: reqQuery.rfqId, status: reqQuery.status },
    allowedSort: ['estimation_number', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const estimation = await estimationRepository.findById(id, { companyId: user.companyId });
  if (!estimation) throw ApiError.notFound('Estimation not found');
  return estimation;
}

async function create(data, user) {
  const rfq = await rfqRepository.findById(data.rfq_id, { companyId: user.companyId });
  if (!rfq) throw ApiError.badRequest('rfq_id does not exist');

  const existing = await estimationRepository.findByNumber(data.estimation_number, user.companyId);
  if (existing) throw ApiError.conflict(`Estimation number '${data.estimation_number}' already exists`);

  return transaction(async (client) => {
    const estimation = await estimationRepository.create(
      { ...data, prepared_by: data.prepared_by || user.id, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Estimation', entityId: estimation.estimation_id, action: 'Insert', userId: user.id, newValue: estimation }, client);
    return estimation;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.status && !isValidTransition(ESTIMATION_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid Estimation status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  if (data.status === 'Approved' && !(await approvalService.isApproved('Estimation', id, APPROVAL_STAGES.ESTIMATION))) {
    throw ApiError.conflict(`Estimation cannot be marked 'Approved' without an Approved '${APPROVAL_STAGES.ESTIMATION}' record`, { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await estimationRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Estimation not found');
    await auditService.log(
      { entityType: 'Estimation', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const items = await estimationItemRepository.findByEstimationId(id);
  if (items.length) {
    throw ApiError.conflict('Cannot delete an Estimation that still has Estimation items', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await estimationRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Estimation', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, remove };
