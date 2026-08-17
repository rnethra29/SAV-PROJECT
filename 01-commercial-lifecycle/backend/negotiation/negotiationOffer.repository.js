'use strict';

const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');
const { parsePagination } = require('../../../shared/backend/utils/helpers');

const T = TABLES.NEGOTIATION_OFFERS.name;

/** Append-only (architecture Phase 5.10: "never updated or deleted; corrections are new rows"). "Final" is determined at read-time as the most recent is_final=true row - see v_item_commercial_analysis_final. */
class NegotiationOfferRepository {
  async findById(id, companyId) {
    const result = await query(`SELECT * FROM ${T} WHERE offer_id = $1 AND company_id = $2`, [id, companyId]);
    return result.rows[0] || null;
  }

  async findByQuotationId(quotationId, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${T} WHERE quotation_id = $1`, [quotationId]);
    const dataResult = await query(
      `SELECT * FROM ${T} WHERE quotation_id = $1 ORDER BY offer_date ASC LIMIT $2 OFFSET $3`,
      [quotationId, limit, offset]
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }

  async findByQuotationItemId(quotationItemId, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${T} WHERE quotation_item_id = $1`, [quotationItemId]);
    const dataResult = await query(
      `SELECT * FROM ${T} WHERE quotation_item_id = $1 ORDER BY offer_date ASC LIMIT $2 OFFSET $3`,
      [quotationItemId, limit, offset]
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }

  async findLatestFinalByQuotationItemId(quotationItemId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${T} WHERE quotation_item_id = $1 AND is_final = true ORDER BY offer_date DESC LIMIT 1`,
      [quotationItemId]
    );
    return result.rows[0] || null;
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

module.exports = new NegotiationOfferRepository();
