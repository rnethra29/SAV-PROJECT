'use strict';

const actualPriceRepository = require('../repositories/actualPrice.repository');
const actualPriceHistoryRepository = require('../repositories/actualPriceHistory.repository');
const rfqItemRepository = require('../repositories/rfqItem.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

async function getCurrent(rfqItemId, user) {
  const rfqItem = await rfqItemRepository.findById(rfqItemId, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.notFound('RFQ item not found');
  const current = await actualPriceRepository.findByRfqItemId(rfqItemId);
  if (!current) throw ApiError.notFound('No Actual Price has been set for this RFQ item yet');
  return current;
}

async function getHistory(rfqItemId, user, pagination) {
  const rfqItem = await rfqItemRepository.findById(rfqItemId, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.notFound('RFQ item not found');
  return actualPriceHistoryRepository.findByRfqItemId(rfqItemId, pagination);
}

/**
 * Sets (creates or changes) the Actual Price for an RFQ item.
 *
 * Architecture Phase 1 rule #5 / Phase 8 rule #3: "Actual price is not
 * overwritten - every change creates a new com_actual_price_history row and
 * updates the pointer in com_actual_price." Both writes happen atomically,
 * in the same transaction, with the same new values - the pointer always
 * reflects the latest row of the history log.
 */
async function setActualPrice(rfqItemId, data, user) {
  const rfqItem = await rfqItemRepository.findById(rfqItemId, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.notFound('RFQ item not found');

  return transaction(async (client) => {
    const existingPointer = await actualPriceRepository.findByRfqItemId(rfqItemId, { client });

    const historyRow = await actualPriceHistoryRepository.create(
      {
        rfq_item_id: rfqItemId,
        actual_rate: data.actual_rate,
        price_basis: data.price_basis,
        price_source_reference: data.price_source_reference || null,
        price_date: data.price_date,
        changed_by: user.id,
        remarks: data.remarks || null,
      },
      { client }
    );

    let pointer;
    if (existingPointer) {
      pointer = await actualPriceRepository.update(
        existingPointer.actual_price_id,
        {
          actual_rate: data.actual_rate,
          unit: data.unit,
          currency_id: data.currency_id,
          price_basis: data.price_basis,
          price_source_reference: data.price_source_reference || null,
          price_date: data.price_date,
          remarks: data.remarks || null,
        },
        { userId: user.id, client }
      );
    } else {
      pointer = await actualPriceRepository.create(
        {
          rfq_item_id: rfqItemId,
          actual_rate: data.actual_rate,
          unit: data.unit,
          currency_id: data.currency_id,
          price_basis: data.price_basis,
          price_source_reference: data.price_source_reference || null,
          price_date: data.price_date,
          remarks: data.remarks || null,
          company_id: user.companyId,
          branch_id: user.branchId,
          created_by: user.id,
          updated_by: user.id,
        },
        { client }
      );
    }

    await auditService.log(
      {
        entityType: 'RFQ',
        entityId: rfqItemId,
        action: existingPointer ? 'Update' : 'Insert',
        userId: user.id,
        oldValue: existingPointer,
        newValue: { actual_price: pointer, history_row: historyRow },
      },
      client
    );

    return { current: pointer, history_row: historyRow };
  });
}

module.exports = { getCurrent, getHistory, setActualPrice };
