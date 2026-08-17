'use strict';

const { roleRepository, permissionRepository, rolePermissionRepository, userRoleRepository } = require('../repositories/secRbac.repository');
const auditService = require('../../../backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../backend/utils/apiError');
const { transaction } = require('../../../backend/config/database');

// ---------- Roles ----------
async function listRoles(activeOnly) {
  return roleRepository.findAll({ activeOnly });
}

async function getRoleById(id) {
  const role = await roleRepository.findById(id);
  if (!role) throw ApiError.notFound('Role not found');
  return role;
}

async function createRole(data, user) {
  const existing = await roleRepository.findByName(data.role_name);
  if (existing) throw ApiError.conflict(`Role '${data.role_name}' already exists`);
  return transaction(async (client) => {
    const role = await roleRepository.create({ ...data, created_by: user.id });
    await auditService.log({ entityType: 'sec_role', entityId: role.role_id, action: 'Insert', userId: user.id, newValue: role }, client);
    return role;
  });
}

async function updateRole(id, data, user) {
  const existing = await getRoleById(id);
  return transaction(async (client) => {
    const updated = await roleRepository.update(id, data);
    await auditService.log({ entityType: 'sec_role', entityId: id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function deactivateRole(id, user) {
  return updateRole(id, { is_active: false }, user);
}

// ---------- Permissions ----------
async function listPermissions(module) {
  return permissionRepository.findAll({ module });
}

async function createPermission(data, user) {
  const existing = await permissionRepository.findByCode(data.permission_code);
  if (existing) throw ApiError.conflict(`Permission code '${data.permission_code}' already exists`);
  return transaction(async (client) => {
    const permission = await permissionRepository.create({ ...data, created_by: user.id });
    await auditService.log({ entityType: 'sec_permission', entityId: permission.permission_id, action: 'Insert', userId: user.id, newValue: permission }, client);
    return permission;
  });
}

// ---------- Role <-> Permission ----------
async function listRolePermissions(roleId) {
  await getRoleById(roleId);
  return rolePermissionRepository.findByRoleId(roleId);
}

async function grantPermission(roleId, permissionId, user) {
  await getRoleById(roleId);
  const permission = await permissionRepository.findById(permissionId);
  if (!permission) throw ApiError.notFound('Permission not found');

  if (await rolePermissionRepository.exists(roleId, permissionId)) {
    throw ApiError.conflict('This role already has this permission', { code: 'ALREADY_GRANTED' });
  }

  return transaction(async (client) => {
    const grant = await rolePermissionRepository.grant({ role_id: roleId, permission_id: permissionId, created_by: user.id });
    await auditService.log({ entityType: 'sec_role', entityId: roleId, action: 'Insert', userId: user.id, newValue: { permission_granted: permission.permission_code } }, client);
    return grant;
  });
}

async function revokePermission(roleId, permissionId, user) {
  await getRoleById(roleId);
  return transaction(async (client) => {
    const revoked = await rolePermissionRepository.revoke(roleId, permissionId);
    if (!revoked) throw ApiError.notFound('This role does not have that permission');
    await auditService.log({ entityType: 'sec_role', entityId: roleId, action: 'Delete', userId: user.id, oldValue: revoked }, client);
    return revoked;
  });
}

// ---------- User <-> Role ----------
async function listUserRoles(userId) {
  return userRoleRepository.findByUserId(userId);
}

async function assignRole(userId, roleId, user) {
  await getRoleById(roleId);
  if (await userRoleRepository.exists(userId, roleId)) {
    throw ApiError.conflict('This user already has this role', { code: 'ALREADY_ASSIGNED' });
  }
  return transaction(async (client) => {
    const assignment = await userRoleRepository.assign({ user_id: userId, role_id: roleId, assigned_by: user.id });
    await auditService.log({ entityType: 'sec_user_role', entityId: assignment.user_role_id, action: 'Insert', userId: user.id, newValue: assignment }, client);
    return assignment;
  });
}

async function unassignRole(userId, roleId, user) {
  return transaction(async (client) => {
    const removed = await userRoleRepository.unassign(userId, roleId);
    if (!removed) throw ApiError.notFound('This user does not have that role');
    await auditService.log({ entityType: 'sec_user_role', entityId: removed.user_role_id, action: 'Delete', userId: user.id, oldValue: removed }, client);
    return removed;
  });
}

/** Hot-path authorization check (doc §14/§20: "every state-changing endpoint checks sec_role_permission before executing - never trust a role name string from the client"). Available for routes that want fine-grained RBAC on top of role.middleware.js's coarser role-name gate. */
async function hasPermission(userId, permissionCode) {
  const codes = await userRoleRepository.findPermissionCodesForUser(userId);
  return codes.includes(permissionCode);
}

module.exports = {
  listRoles, getRoleById, createRole, updateRole, deactivateRole,
  listPermissions, createPermission,
  listRolePermissions, grantPermission, revokePermission,
  listUserRoles, assignRole, unassignRole,
  hasPermission,
};
