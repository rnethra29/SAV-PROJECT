'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createMarketPriceForRfqItem } = require('../validators/marketPrice.validator');
const { setActualPrice } = require('../validators/actualPrice.validator');
const marketPriceController = require('../controllers/marketPrice.controller');
const actualPriceController = require('../controllers/actualPrice.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const rfqItemIdP = idParam('rfqItemId');

/**
 * @openapi
 * tags:
 *   - name: MarketPrice
 *     description: Multi-source market price references, append-only (architecture Phase 5.5)
 *   - name: ActualPrice
 *     description: Current actual price pointer + append-only history (architecture Phase 5.6/5.7)
 */
router.get('/:rfqItemId/market-prices', validate(rfqItemIdP, 'params'), validate(paginationQuery, 'query'), marketPriceController.listByRfqItem);
router.post(
  '/:rfqItemId/market-prices',
  requireRole(ROLES.COMMERCIAL_COSTING_TEAM, ROLES.ESTIMATION_ENGINEER),
  validate(rfqItemIdP, 'params'),
  validate(createMarketPriceForRfqItem),
  marketPriceController.createForRfqItem
);

router.get('/:rfqItemId/actual-price', validate(rfqItemIdP, 'params'), actualPriceController.getCurrent);
router.get('/:rfqItemId/actual-price/history', validate(rfqItemIdP, 'params'), validate(paginationQuery, 'query'), actualPriceController.getHistory);
router.put(
  '/:rfqItemId/actual-price',
  requireRole(ROLES.COMMERCIAL_COSTING_TEAM),
  validate(rfqItemIdP, 'params'),
  validate(setActualPrice),
  actualPriceController.set
);

module.exports = router;
