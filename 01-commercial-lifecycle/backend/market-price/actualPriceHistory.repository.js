'use strict';

const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');
const { parsePagination } = require('../../../shared/backend/utils/helpers');

const T = TABLES.ACTUAL_PRICE_HISTORY.name;

/** Append-only, no company_id/branch_id (architecture Phase 5.7 - "lighter audit set"). Scoping/authorization happens via the parent rfq_item's company_id at the service layer. */
class ActualPriceHistoryRepository {
  async create(data, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await exec(`INSERT INTO ${T} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }

  async findByRfqItemId(rfqItemId, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${T} WHERE rfq_item_id = $1`, [rfqItemId]);
    const dataResult = await query(
      `SELECT * FROM ${T} WHERE rfq_item_id = $1 ORDER BY changed_at DESC LIMIT $2 OFFSET $3`,
      [rfqItemId, limit, offset]
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }
}

module.exports = new ActualPriceHistoryRepository();
