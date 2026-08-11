'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const analysisController = require('../controllers/analysis.controller');

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Analysis
 *     description: Read-only derived views - Actual vs Quoted, Profit, Estimation cost roll-up (architecture Phase 15, Phase 18 #7)
 */
router.get('/item-commercial-analysis', validate(paginationQuery, 'query'), analysisController.itemCommercialAnalysis);
router.get('/item-commercial-analysis/final', validate(paginationQuery, 'query'), analysisController.itemCommercialAnalysisFinal);
router.get('/estimation-item-cost', validate(paginationQuery, 'query'), analysisController.estimationItemCost);
router.get('/item-commercial-analysis/by-rfq-item/:rfqItemId', validate(idParam('rfqItemId'), 'params'), analysisController.byRfqItem);

module.exports = router;
