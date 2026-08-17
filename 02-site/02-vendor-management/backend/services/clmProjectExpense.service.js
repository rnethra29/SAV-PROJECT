'use strict';

const clmProjectExpenseRepository = require('../repositories/clmProjectExpense.repository');
const clmProjectRepository = require('../repositories/clmProject.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const vndPurchaseOrderRepository = require('../repositories/vndPurchaseOrder.repository');
const vndVendorInvoiceRepository = require('../repositories/vndVendorInvoice.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

/** Mirrors the DB CHECK constraint (doc §6.3) for a fast, friendly error ahead of the round-trip. */
function assertSourceProvided(data) {
  if (!data.vendor_id && !data.purchase_order_id && !data.subcontract_po_id && data.expense_category !== 'Other') {
    throw ApiError.badRequest("At least one of vendor_id, purchase_order_id, or subcontract_po_id is required unless expense_category is 'Other'", { code: 'CHECK_VIOLATION' });
  }
}

async function list(user, reqQuery) {
  return clmProjectExpenseRepository.findAll({
    companyId: user.companyId,
    filters: { project_id: reqQuery.projectId, vendor_id: reqQuery.vendorId, expense_category: reqQuery.category, approval_status: reqQuery.approvalStatus },
    allowedSort: ['expense_date', 'amount', 'expense_category', 'approval_status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function listByProject(projectId, user, reqQuery) {
  const project = await clmProjectRepository.findById(projectId, { companyId: user.companyId });
  if (!project) throw ApiError.notFound('Project not found');
  return list(user, { ...reqQuery, projectId });
}

async function getById(id, user) {
  const expense = await clmProjectExpenseRepository.findById(id, { companyId: user.companyId });
  if (!expense) throw ApiError.notFound('Project expense not found');
  return expense;
}

async function create(data, user) {
  assertSourceProvided(data);

  const project = await clmProjectRepository.findById(data.project_id, { companyId: user.companyId });
  if (!project) throw ApiError.badRequest('project_id does not exist');
  if (data.vendor_id) {
    const vendor = await vndVendorRepository.findById(data.vendor_id, { companyId: user.companyId });
    if (!vendor) throw ApiError.badRequest('vendor_id does not exist');
  }
  if (data.purchase_order_id) {
    const po = await vndPurchaseOrderRepository.findById(data.purchase_order_id, { companyId: user.companyId });
    if (!po) throw ApiError.badRequest('purchase_order_id does not exist');
  }
  if (data.vendor_invoice_id) {
    const invoice = await vndVendorInvoiceRepository.findById(data.vendor_invoice_id, { companyId: user.companyId });
    if (!invoice) throw ApiError.badRequest('vendor_invoice_id does not exist');
  }

  return transaction(async (client) => {
    const expense = await clmProjectExpenseRepository.create(
      { ...data, payment_status: 'Unpaid', approval_status: 'Pending', company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Project', entityId: data.project_id, action: 'Insert', userId: user.id, newValue: { expense_created: expense } }, client);
    return expense;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  assertSourceProvided({ ...existing, ...data });

  return transaction(async (client) => {
    const updated = await clmProjectExpenseRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Project expense not found');
    await auditService.log({ entityType: 'Project', entityId: existing.project_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function decideApproval(id, { status, remarks }, user) {
  const existing = await getById(id, user);
  if (existing.approval_status !== 'Pending') {
    throw ApiError.conflict(`This expense has already been decided (approval_status='${existing.approval_status}')`, { code: 'ALREADY_DECIDED' });
  }

  return transaction(async (client) => {
    const updated = await clmProjectExpenseRepository.update(id, { approval_status: status, remarks: remarks ?? existing.remarks }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Project', entityId: existing.project_id, action: status === 'Approved' ? 'Approve' : 'Reject', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const deleted = await clmProjectExpenseRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Project', entityId: existing.project_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, listByProject, getById, create, update, decideApproval, remove };
