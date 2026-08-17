'use strict';

const { Router } = require('express');
const authenticate = require('../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../shared/backend/validators/common.validator');
const {
  createItemCategory, updateItemCategory,
  createPriceSourceType, updatePriceSourceType,
  createDocumentCategory, updateDocumentCategory,
} = require('./lookup.validator');
const { itemCategoryController, priceSourceTypeController, documentCategoryController } = require('./lookup.controller');
const { ROLES } = require('../../../shared/backend/models/enums');

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
 *   - name: Lookups
 *     description: Item categories, price source types, document categories
 */
mountLookup('/item-categories', itemCategoryController, createItemCategory, updateItemCategory);
mountLookup('/price-source-types', priceSourceTypeController, createPriceSourceType, updatePriceSourceType);
mountLookup('/document-categories', documentCategoryController, createDocumentCategory, updateDocumentCategory);

module.exports = router;
