'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { updateExpense, decideExpenseApproval } = require('../validators/clmProjectExpense.validator');
const clmProjectExpenseController = require('../controllers/clmProjectExpense.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/', validate(paginationQuery, 'query'), clmProjectExpenseController.list);
router.get('/:id', validate(idP, 'params'), clmProjectExpenseController.getById);
router.patch('/:id', requireRole(ROLES.SITE_ENGINEER, ROLES.PROJECT_MANAGER), validate(idP, 'params'), validate(updateExpense), clmProjectExpenseController.update);
router.post('/:id/approve', requireRole(ROLES.PROJECT_MANAGER), validate(idP, 'params'), validate(decideExpenseApproval), clmProjectExpenseController.decideApproval);
router.delete('/:id', requireRole(ROLES.PROJECT_MANAGER), validate(idP, 'params'), clmProjectExpenseController.remove);

module.exports = router;
