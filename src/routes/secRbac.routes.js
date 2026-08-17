'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { createRole, updateRole, createPermission, grantPermission, assignRole } = require('../validators/secRbac.validator');
const secRbacController = require('../controllers/secRbac.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
router.use(requireRole(ROLES.ADMIN)); // doc §14: "Admin: sec_role.manage" - the whole RBAC surface is Admin-only

const idP = idParam('id');
const userIdParam = idParam('userId');
const roleIdInPath = idParam('roleId');

/**
 * @openapi
 * tags:
 *   - name: RBAC
 *     description: sec_role / sec_permission / sec_role_permission / sec_user_role (architecture doc §14) - Admin-only
 */
router.get('/roles', secRbacController.listRoles);
router.post('/roles', validate(createRole), secRbacController.createRole);
router.get('/roles/:id', validate(idP, 'params'), secRbacController.getRole);
router.patch('/roles/:id', validate(idP, 'params'), validate(updateRole), secRbacController.updateRole);
router.post('/roles/:id/deactivate', validate(idP, 'params'), secRbacController.deactivateRole);

router.get('/permissions', secRbacController.listPermissions);
router.post('/permissions', validate(createPermission), secRbacController.createPermission);

router.get('/roles/:roleId/permissions', validate(roleIdInPath, 'params'), secRbacController.listRolePermissions);
router.post('/roles/:roleId/permissions', validate(roleIdInPath, 'params'), validate(grantPermission), secRbacController.grantPermission);
router.delete('/roles/:roleId/permissions/:permissionId', secRbacController.revokePermission);

router.get('/users/:userId/roles', validate(userIdParam, 'params'), secRbacController.listUserRoles);
router.post('/users/:userId/roles', validate(userIdParam, 'params'), validate(assignRole), secRbacController.assignRole);
router.delete('/users/:userId/roles/:roleId', validate(userIdParam, 'params'), secRbacController.unassignRole);

module.exports = router;
