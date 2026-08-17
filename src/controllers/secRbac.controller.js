'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const secRbacService = require('../services/secRbac.service');

const listRoles = asyncHandler(async (req, res) => {
  const activeOnly = req.query.activeOnly !== 'false';
  const roles = await secRbacService.listRoles(activeOnly);
  return success(res, { data: roles });
});

const getRole = asyncHandler(async (req, res) => {
  const role = await secRbacService.getRoleById(req.params.id);
  return success(res, { data: role });
});

const createRole = asyncHandler(async (req, res) => {
  const role = await secRbacService.createRole(req.body, req.user);
  return created(res, role);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await secRbacService.updateRole(req.params.id, req.body, req.user);
  return success(res, { data: role, message: 'Role updated' });
});

const deactivateRole = asyncHandler(async (req, res) => {
  const role = await secRbacService.deactivateRole(req.params.id, req.user);
  return success(res, { data: role, message: 'Role deactivated' });
});

const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await secRbacService.listPermissions(req.query.module);
  return success(res, { data: permissions });
});

const createPermission = asyncHandler(async (req, res) => {
  const permission = await secRbacService.createPermission(req.body, req.user);
  return created(res, permission);
});

const listRolePermissions = asyncHandler(async (req, res) => {
  const permissions = await secRbacService.listRolePermissions(req.params.roleId);
  return success(res, { data: permissions });
});

const grantPermission = asyncHandler(async (req, res) => {
  const grant = await secRbacService.grantPermission(req.params.roleId, req.body.permission_id, req.user);
  return created(res, grant, 'Permission granted');
});

const revokePermission = asyncHandler(async (req, res) => {
  const revoked = await secRbacService.revokePermission(req.params.roleId, req.params.permissionId, req.user);
  return success(res, { data: revoked, message: 'Permission revoked' });
});

const listUserRoles = asyncHandler(async (req, res) => {
  const roles = await secRbacService.listUserRoles(req.params.userId);
  return success(res, { data: roles });
});

const assignRole = asyncHandler(async (req, res) => {
  const assignment = await secRbacService.assignRole(req.params.userId, req.body.role_id, req.user);
  return created(res, assignment, 'Role assigned');
});

const unassignRole = asyncHandler(async (req, res) => {
  const removed = await secRbacService.unassignRole(req.params.userId, req.params.roleId, req.user);
  return success(res, { data: removed, message: 'Role unassigned' });
});

module.exports = {
  listRoles, getRole, createRole, updateRole, deactivateRole,
  listPermissions, createPermission,
  listRolePermissions, grantPermission, revokePermission,
  listUserRoles, assignRole, unassignRole,
};
