'use strict';

const clmProjectCostRepository = require('../repositories/clmProjectCost.repository');
const clmProjectRepository = require('../repositories/clmProject.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

async function assertProjectExists(projectId, user) {
  const project = await clmProjectRepository.findById(projectId, { companyId: user.companyId });
  if (!project) throw ApiError.badRequest('project_id does not exist');
  return project;
}

async function listByProject(projectId, user) {
  await assertProjectExists(projectId, user);
  return clmProjectCostRepository.findByProjectId(projectId);
}

async function getById(id, user) {
  const cost = await clmProjectCostRepository.findById(id, { companyId: user.companyId });
  if (!cost) throw ApiError.notFound('Project cost plan row not found');
  return cost;
}

/** One row per (project_id, cost_category) - doc §6.2/UNIQUE constraint. */
async function create(data, user) {
  await assertProjectExists(data.project_id, user);

  const existing = await clmProjectCostRepository.findByProjectAndCategory(data.project_id, data.cost_category);
  if (existing) throw ApiError.conflict(`A cost plan row for category '${data.cost_category}' already exists for this project - update it instead`, { code: 'UNIQUE_VIOLATION' });

  return transaction(async (client) => {
    const cost = await clmProjectCostRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Project', entityId: data.project_id, action: 'Insert', userId: user.id, newValue: { project_cost_created: cost } }, client);
    return cost;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.cost_category && data.cost_category !== existing.cost_category) {
    const conflict = await clmProjectCostRepository.findByProjectAndCategory(existing.project_id, data.cost_category, { excludeId: id });
    if (conflict) throw ApiError.conflict(`A cost plan row for category '${data.cost_category}' already exists for this project`, { code: 'UNIQUE_VIOLATION' });
  }

  return transaction(async (client) => {
    const updated = await clmProjectCostRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Project cost plan row not found');
    await auditService.log({ entityType: 'Project', entityId: existing.project_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

module.exports = { listByProject, getById, create, update };
