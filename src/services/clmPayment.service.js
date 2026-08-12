'use strict';

const clmPaymentRepository = require('../repositories/clmPayment.repository');
const clmPaymentAllocationRepository = require('../repositories/clmPaymentAllocation.repository');
const clmClientRepository = require('../repositories/clmClient.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');
const { CLM_PAYMENT_VERIFICATION_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');

async function list(user, reqQuery) {
  return clmPaymentRepository.findAll({
    companyId: user.companyId,
    filters: { client_id: reqQuery.clientId, project_id: reqQuery.projectId, verification_status: reqQuery.verificationStatus },
    allowedSort: ['payment_date', 'amount', 'verification_status', 'created_at'],
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
  const payment = await clmPaymentRepository.findById(id, { companyId: user.companyId });
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}

async function create(data, user) {
  const clientRow = await clmClientRepository.findById(data.client_id, { companyId: user.companyId });
  if (!clientRow) throw ApiError.badRequest('client_id does not exist');

  const existing = await clmPaymentRepository.findByReferenceNumber(data.payment_reference_number, user.companyId);
  if (existing) throw ApiError.conflict(`Payment reference number '${data.payment_reference_number}' already exists`);

  return transaction(async (client) => {
    const payment = await clmPaymentRepository.create(
      { ...data, verification_status: 'Pending', company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'ClientPayment', entityId: payment.payment_id, action: 'Insert', userId: user.id, newValue: payment }, client);
    return payment;
  });
}

/** Non-financial field edits only - amount/method changes to a payment that already has allocations should be a new payment, not a mutation (ledger-pattern convention, doc §17). */
async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.amount !== undefined && data.amount !== existing.amount) {
    const allocations = await clmPaymentAllocationRepository.findByPaymentId(id);
    if (allocations.length) throw ApiError.conflict('Cannot change the amount of a payment that already has allocations', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const updated = await clmPaymentRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Payment not found');
    await auditService.log({ entityType: 'ClientPayment', entityId: id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

/**
 * Verification gate (architecture doc §15 open policy, resolved here as
 * recommended): unverified payments are still visible but a stricter
 * downstream reading of `v_client_billing_summary.paid_amount` may choose to
 * exclude them - this endpoint is what flips a payment from 'Pending'.
 */
async function decideVerification(id, { status, remarks }, user) {
  const existing = await getById(id, user);
  if (!isValidTransition(CLM_PAYMENT_VERIFICATION_TRANSITIONS, existing.verification_status, status)) {
    throw ApiError.badRequest(`Invalid verification status transition: '${existing.verification_status}' -> '${status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  return transaction(async (client) => {
    const updated = await clmPaymentRepository.update(
      id,
      { verification_status: status, verified_by: user.id, remarks: remarks ?? existing.remarks },
      { companyId: user.companyId, userId: user.id, client }
    );
    if (!updated) throw ApiError.notFound('Payment not found');
    await auditService.log({ entityType: 'ClientPayment', entityId: id, action: 'StatusChange', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const allocations = await clmPaymentAllocationRepository.findByPaymentId(id);
  if (allocations.length) throw ApiError.conflict('Cannot delete a payment that already has allocations against it', { code: 'HAS_DEPENDENTS' });

  return transaction(async (client) => {
    const deleted = await clmPaymentRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ClientPayment', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, listByClient, getById, create, update, decideVerification, remove };
