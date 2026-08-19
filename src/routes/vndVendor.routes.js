'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createVendor, updateVendor } = require('../validators/vndVendor.validator');
const { createContactForVendor } = require('../validators/vndVendorContact.validator');
const { createBankAccountForVendor } = require('../validators/vndVendorBankAccount.validator');
const { createMaterialServiceForVendor } = require('../validators/vndMaterialService.validator');
const { createRatingForVendor } = require('../validators/vndVendorRating.validator');

const vndVendorController = require('../controllers/vndVendor.controller');
const vndVendorContactController = require('../controllers/vndVendorContact.controller');
const vndVendorBankAccountController = require('../controllers/vndVendorBankAccount.controller');
const vndMaterialServiceController = require('../controllers/vndMaterialService.controller');
const vndVendorRatingController = require('../controllers/vndVendorRating.controller');

const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedVendorIdParam = idParam('vendorId');

/**
 * @openapi
 * tags:
 *   - name: Vendors/Vendor
 *     description: Vendor master + nested contacts/bank-accounts/materials/ratings + performance (Sites module, Vendor Management & Procurement submodule)
 */
router.get('/', validate(paginationQuery, 'query'), vndVendorController.list);
router.post('/', requireRole(ROLES.PROCUREMENT_MANAGER), validate(createVendor), vndVendorController.create);
router.get('/:id', validate(idP, 'params'), vndVendorController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), validate(updateVendor), vndVendorController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndVendorController.remove);

router.get('/:vendorId/performance', validate(nestedVendorIdParam, 'params'), vndVendorController.getPerformance);
router.get('/:vendorId/financial-summary', validate(nestedVendorIdParam, 'params'), vndVendorController.getFinancialSummary);

// Contacts, nested under vendor
router.get('/:vendorId/contacts', validate(nestedVendorIdParam, 'params'), vndVendorContactController.listByVendor);
router.post(
  '/:vendorId/contacts',
  requireRole(ROLES.PROCUREMENT_MANAGER, ROLES.PROCUREMENT_OFFICER),
  validate(nestedVendorIdParam, 'params'),
  validate(createContactForVendor),
  vndVendorContactController.createUnderVendor
);

// Bank accounts, nested under vendor (sensitive - doc §20)
router.get('/:vendorId/bank-accounts', validate(nestedVendorIdParam, 'params'), vndVendorBankAccountController.listByVendor);
router.post(
  '/:vendorId/bank-accounts',
  requireRole(ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER),
  validate(nestedVendorIdParam, 'params'),
  validate(createBankAccountForVendor),
  vndVendorBankAccountController.createUnderVendor
);

// Materials/services catalog, nested under vendor
router.get('/:vendorId/materials', validate(nestedVendorIdParam, 'params'), vndMaterialServiceController.listByVendor);
router.post(
  '/:vendorId/materials',
  requireRole(ROLES.PROCUREMENT_OFFICER, ROLES.PROCUREMENT_MANAGER),
  validate(nestedVendorIdParam, 'params'),
  validate(createMaterialServiceForVendor),
  vndMaterialServiceController.createUnderVendor
);

// Ratings, nested under vendor (append-only)
router.get('/:vendorId/ratings', validate(nestedVendorIdParam, 'params'), vndVendorRatingController.listByVendor);
router.post(
  '/:vendorId/ratings',
  requireRole(ROLES.PROCUREMENT_OFFICER, ROLES.PROCUREMENT_MANAGER, ROLES.SITE_ENGINEER),
  validate(nestedVendorIdParam, 'params'),
  validate(createRatingForVendor),
  vndVendorRatingController.createUnderVendor
);

module.exports = router;
