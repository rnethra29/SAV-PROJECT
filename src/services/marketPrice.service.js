'use strict';

const marketPriceRepository = require('../repositories/marketPriceReference.repository');
const rfqItemRepository = require('../repositories/rfqItem.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

async function listByRfqItem(rfqItemId, user, pagination) {
  const rfqItem = await rfqItemRepository.findById(rfqItemId, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.notFound('RFQ item not found');
  return marketPriceRepository.findByRfqItemId(rfqItemId, pagination);
}

async function create(data, user) {
  const rfqItem = await rfqItemRepository.findById(data.rfq_item_id, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.badRequest('rfq_item_id does not exist');

  return transaction(async (client) => {
    const row = await marketPriceRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'RFQ', entityId: data.rfq_item_id, action: 'Insert', userId: user.id, newValue: { market_price_reference: row } }, client);
    return row;
  });
}

module.exports = { listByRfqItem, create };
