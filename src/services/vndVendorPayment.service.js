'use strict';

const vndVendorPaymentRepository = require('../repositories/vndVendorPayment.repository');
const vndVendorPaymentAllocationRepository = require('../repositories/vndVendorPaymentAllocation.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const vndVendorBankAccountRepository = require('../repositories/vndVendorBankAccount.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');
const { VND_PAYMENT_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');

async function list(user, reqQuery) {
  return vndVendorPaymentRepository.findAll({
    companyId: user.companyId,
    filters: { vendor_id: reqQuery.vendorId, project_id: reqQuery.projectId, payment_status: reqQuery.status },
    allowedSort: ['payment_date', 'amount', 'payment_status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const payment = await vndVendorPaymentRepository.findById(id, { companyId: user.companyId });
  if (!payment) throw ApiError.notFound('Vendor payment not found');
  return payment;
}

async function create(data, user) {
  const vendor = await vndVendorRepository.findById(data.vendor_id, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');
  if (data.bank_account_id) {
    const account = await vndVendorBankAccountRepository.findById(data.bank_account_id, { companyId: user.companyId });
    if (!account) throw ApiError.badRequest('bank_account_id does not exist');
    if (account.vendor_id !== data.vendor_id) throw ApiError.badRequest('bank_account_id must belong to the same vendor');
  }

  const existing = await vndVendorPaymentRepository.findByReferenceNumber(data.payment_reference_number, user.companyId);
  if (existing) throw ApiError.conflict(`Payment reference number '${data.payment_reference_number}' already exists`);

  return transaction(async (client) => {
    const payment = await vndVendorPaymentRepository.create(
      { ...data, payment_status: 'Pending', company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'VendorPayment', entityId: payment.vendor_payment_id, action: 'Insert', userId: user.id, newValue: payment }, client);
    return payment;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  if (Number(existing.amount) !== undefined && data.amount !== undefined && data.amount !== existing.amount) {
    const allocations = await vndVendorPaymentAllocationRepository.findByPaymentId(id);
    if (allocations.length) throw ApiError.conflict('Cannot change the amount of a payment that already has allocations', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const updated = await vndVendorPaymentRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Vendor payment not found');
    await auditService.log({ entityType: 'VendorPayment', entityId: id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

/** Required-approval-before-payment gate (doc §6.15) - a Finance Manager stamps `approved_by`; `decideStatus()` below then requires it before allowing 'Processed'. */
async function approve(id, user) {
  const existing = await getById(id, user);
  if (existing.approved_by) throw ApiError.conflict('This payment has already been approved', { code: 'ALREADY_DECIDED' });

  return transaction(async (client) => {
    const updated = await vndVendorPaymentRepository.update(id, { approved_by: user.id }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'VendorPayment', entityId: id, action: 'Approve', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function decideStatus(id, status, user) {
  const existing = await getById(id, user);
  if (!isValidTransition(VND_PAYMENT_TRANSITIONS, existing.payment_status, status)) {
    throw ApiError.badRequest(`Invalid payment status transition: '${existing.payment_status}' -> '${status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }
  if (status === 'Processed' && !existing.approved_by) {
    throw ApiError.conflict('Payment must be approved before it can be marked Processed', { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await vndVendorPaymentRepository.update(id, { payment_status: status }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'VendorPayment', entityId: id, action: status === 'Reversed' ? 'Cancel' : 'Payment', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

module.exports = { list, getById, create, update, approve, decideStatus };
