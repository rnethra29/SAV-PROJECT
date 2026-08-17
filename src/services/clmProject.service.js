'use strict';

const clmProjectRepository = require('../repositories/clmProject.repository');
const clmProjectCostRepository = require('../repositories/clmProjectCost.repository');
const clmClientRepository = require('../repositories/clmClient.repository');
const auditService = require('../services/audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');
const { CLM_PROJECT_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');

async function list(user, reqQuery) {
  return clmProjectRepository.findAll({
    companyId: user.companyId,
    filters: { client_id: reqQuery.clientId, project_status: reqQuery.status, project_manager_id: reqQuery.projectManagerId },
    allowedSort: ['project_code', 'project_name', 'project_status', 'start_date', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const project = await clmProjectRepository.findById(id, { companyId: user.companyId });
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

/** Project is the hub every financial fact in this submodule hangs off (doc's closing "Central-entity check") - see v_project_financial_summary for the assembled view. */
async function create(data, user) {
  const clientRow = await clmClientRepository.findById(data.client_id, { companyId: user.companyId });
  if (!clientRow) throw ApiError.badRequest('client_id does not exist');

  const existing = await clmProjectRepository.findByCode(data.project_code, user.companyId);
  if (existing) throw ApiError.conflict(`Project code '${data.project_code}' already exists`);

  return transaction(async (client) => {
    const project = await clmProjectRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Project', entityId: project.project_id, action: 'Insert', userId: user.id, newValue: project }, client);
    return project;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.project_status && !isValidTransition(CLM_PROJECT_TRANSITIONS, existing.project_status, data.project_status)) {
    throw ApiError.badRequest(`Invalid project status transition: '${existing.project_status}' -> '${data.project_status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  return transaction(async (client) => {
    const updated = await clmProjectRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Project not found');
    await auditService.log(
      { entityType: 'Project', entityId: id, action: data.project_status && data.project_status !== existing.project_status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const costPlan = await clmProjectCostRepository.findByProjectId(id);
  if (costPlan.length) throw ApiError.conflict('Cannot delete a project that still has a cost plan on record - remove it first', { code: 'HAS_DEPENDENTS' });

  const dependentResult = await query(
    `SELECT
       (SELECT COUNT(*) FROM vnd_purchase_order WHERE project_id = $1 AND deleted_at IS NULL) AS purchase_orders,
       (SELECT COUNT(*) FROM vnd_vendor_invoice WHERE project_id = $1 AND deleted_at IS NULL) AS vendor_invoices,
       (SELECT COUNT(*) FROM clm_project_expense WHERE project_id = $1 AND deleted_at IS NULL) AS expenses,
       (SELECT COUNT(*) FROM clm_client_invoice WHERE project_id = $1 AND deleted_at IS NULL) AS client_invoices`,
    [id]
  );
  const { purchase_orders, vendor_invoices, expenses, client_invoices } = dependentResult.rows[0];
  if (Number(purchase_orders) || Number(vendor_invoices) || Number(expenses) || Number(client_invoices)) {
    throw ApiError.conflict('Cannot delete a project with purchase orders, vendor invoices, expenses, or client invoices on record', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await clmProjectRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Project', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, remove };
