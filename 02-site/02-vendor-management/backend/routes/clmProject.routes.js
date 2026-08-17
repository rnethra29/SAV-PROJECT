'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../../../../shared/backend/validators/common.validator');
const { createProject, updateProject } = require('../validators/clmProject.validator');
const { createCostForProject } = require('../validators/clmProjectCost.validator');
const { createExpenseForProject } = require('../validators/clmProjectExpense.validator');

const clmProjectController = require('../controllers/clmProject.controller');
const clmProjectCostController = require('../controllers/clmProjectCost.controller');
const clmProjectExpenseController = require('../controllers/clmProjectExpense.controller');

const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedProjectIdParam = idParam('projectId');

/**
 * @openapi
 * tags:
 *   - name: Vendors/Projects
 *     description: Client Management extension - Project (the hub of this submodule), Cost Plan, Expenses (Sites module)
 */
router.get('/', validate(paginationQuery, 'query'), clmProjectController.list);
router.get('/financial-summaries', clmProjectController.listFinancialSummaries);
router.post('/', requireRole(ROLES.PROJECT_MANAGER), validate(createProject), clmProjectController.create);
router.get('/:id', validate(idP, 'params'), clmProjectController.getById);
router.patch('/:id', requireRole(ROLES.PROJECT_MANAGER), validate(idP, 'params'), validate(updateProject), clmProjectController.update);
router.delete('/:id', requireRole(ROLES.PROJECT_MANAGER), validate(idP, 'params'), clmProjectController.remove);

router.get('/:projectId/financial-summary', validate(nestedProjectIdParam, 'params'), clmProjectController.getFinancialSummary);
router.get('/:projectId/cost-summary', validate(nestedProjectIdParam, 'params'), clmProjectController.getCostSummary);

// Cost plan, nested under project
router.get('/:projectId/cost-plan', validate(nestedProjectIdParam, 'params'), clmProjectCostController.listByProject);
router.post(
  '/:projectId/cost-plan',
  requireRole(ROLES.PROJECT_MANAGER),
  validate(nestedProjectIdParam, 'params'),
  validate(createCostForProject),
  clmProjectCostController.createUnderProject
);

// Expenses, nested under project
router.get('/:projectId/expenses', validate(nestedProjectIdParam, 'params'), validate(paginationQuery, 'query'), clmProjectExpenseController.listByProject);
router.post(
  '/:projectId/expenses',
  requireRole(ROLES.SITE_ENGINEER, ROLES.PROJECT_MANAGER),
  validate(nestedProjectIdParam, 'params'),
  validate(createExpenseForProject),
  clmProjectExpenseController.createUnderProject
);

module.exports = router;
