'use strict';

const approvalRepository = require('../repositories/approval.repository');
const auditService = require('./audit.service');
const ApiError = require('../../utils/apiError');
const { transaction } = require('../../config/database');
const { ROLES } = require('../../models/enums');

async function listByEntity(entityType, entityId) {
  return approvalRepository.findByEntity(entityType, entityId);
}

async function getById(id, user) {
  const approval = await approvalRepository.findById(id, user.companyId);
  if (!approval) throw ApiError.notFound('Approval not found');
  return approval;
}

/** Requests approval for a gate (architecture Phase 8 rule #13: one row per (entity, stage); a stage can be re-requested after a prior Rejected decision, but not while one is still Pending). */
async function requestApproval(data, user) {
  const existingPending = await approvalRepository.findPendingStage(data.entity_type, data.entity_id, data.approval_stage);
  if (existingPending) {
    throw ApiError.conflict('This entity/stage already has a Pending approval request', { code: 'APPROVAL_ALREADY_PENDING' });
  }

  return transaction(async (client) => {
    const approval = await approvalRepository.create(
      {
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        approval_stage: data.approval_stage,
        approver_id: data.approver_id,
        status: 'Pending',
        comments: data.comments || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
      },
      { client }
    );
    await auditService.log({ entityType: data.entity_type, entityId: data.entity_id, action: 'Insert', userId: user.id, newValue: { approval_requested: approval } }, client);
    return approval;
  });
}

async function assertActorCanDecide(approval, user) {
  if (user.role === ROLES.ADMIN) return;
  if (user.id === approval.approver_id) return;
  if (user.role === ROLES.APPROVER) return;
  throw ApiError.forbidden('Only the assigned approver (or an Approver/Admin) may decide this approval');
}

async function decide(id, decision, user) {
  const approval = await getById(id, user);
  if (approval.status !== 'Pending') {
    throw ApiError.conflict(`This approval has already been decided (status='${approval.status}')`, { code: 'ALREADY_DECIDED' });
  }
  await assertActorCanDecide(approval, user);

  if (decision.status === 'Rejected' && !decision.rejectionReason) {
    throw ApiError.badRequest('rejectionReason is required when rejecting');
  }

  return transaction(async (client) => {
    const updated = await approvalRepository.decide(
      id,
      { status: decision.status, comments: decision.comments, rejectionReason: decision.rejectionReason },
      { client }
    );
    await auditService.log(
      { entityType: approval.entity_type, entityId: approval.entity_id, action: 'StatusChange', userId: user.id, oldValue: approval, newValue: updated },
      client
    );
    return updated;
  });
}

/** Gate check other services can call before allowing a status transition that requires prior approval (architecture Phase 8 rule #13). */
async function isApproved(entityType, entityId, stage) {
  const approved = await approvalRepository.findApprovedStage(entityType, entityId, stage);
  return Boolean(approved);
}

module.exports = { listByEntity, getById, requestApproval, decide, isApproved };
