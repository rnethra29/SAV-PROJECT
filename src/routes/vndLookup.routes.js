'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { createVendorType, updateVendorType, createMaterialCategory, updateMaterialCategory } = require('../validators/vndLookup.validator');
const { vendorTypeController, materialCategoryController } = require('../controllers/vndLookup.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

function mountLookup(path, controller, createSchema, updateSchema) {
  const sub = Router();
  sub.get('/', controller.list);
  sub.get('/:id', validate(idParam('id'), 'params'), controller.getById);
  sub.post('/', requireRole(ROLES.ADMIN), validate(createSchema), controller.create);
  sub.patch('/:id', requireRole(ROLES.ADMIN), validate(idParam('id'), 'params'), validate(updateSchema), controller.update);
  sub.post('/:id/deactivate', requireRole(ROLES.ADMIN), validate(idParam('id'), 'params'), controller.deactivate);
  router.use(path, sub);
}

/**
 * @openapi
 * tags:
 *   - name: Vendors/Lookups
 *     description: Vendor types, material categories (Sites module, Vendor Management & Procurement submodule)
 */
mountLookup('/vendor-types', vendorTypeController, createVendorType, updateVendorType);
mountLookup('/material-categories', materialCategoryController, createMaterialCategory, updateMaterialCategory);

module.exports = router;
