'use strict';

const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');
const { parsePagination } = require('../../../shared/backend/utils/helpers');

const T = TABLES.MARKET_PRICE_REFERENCE.name;

/** Append-only per architecture Phase 5.5 - every new market observation is a new row, nothing is ever updated or deleted. */
class MarketPriceReferenceRepository {
  async findById(id, companyId) {
    const result = await query(`SELECT * FROM ${T} WHERE market_price_id = $1 AND company_id = $2`, [id, companyId]);
    return result.rows[0] || null;
  }

  async findByRfqItemId(rfqItemId, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${T} WHERE rfq_item_id = $1`, [rfqItemId]);
    const dataResult = await query(
      `SELECT mp.*, pst.source_name FROM ${T} mp
       JOIN com_price_source_type pst ON pst.source_type_id = mp.source_type_id
       WHERE mp.rfq_item_id = $1 ORDER BY mp.price_date DESC, mp.created_at DESC LIMIT $2 OFFSET $3`,
      [rfqItemId, limit, offset]
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }

  async create(data, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await exec(`INSERT INTO ${T} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }
}

module.exports = new MarketPriceReferenceRepository();
