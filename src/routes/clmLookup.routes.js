'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const {
  createClientType, updateClientType,
  createIndustry, updateIndustry,
  createContactType, updateContactType,
} = require('../validators/clmLookup.validator');
const { clientTypeController, industryController, contactTypeController } = require('../controllers/clmLookup.controller');
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
 *   - name: ClientManagement/Lookups
 *     description: Client types, industries, contact types (Sites module, Client Management submodule)
 */
mountLookup('/client-types', clientTypeController, createClientType, updateClientType);
mountLookup('/industries', industryController, createIndustry, updateIndustry);
mountLookup('/contact-types', contactTypeController, createContactType, updateContactType);

module.exports = router;
