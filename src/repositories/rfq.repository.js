'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class RfqRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.RFQ.name, pk: TABLES.RFQ.pk });
  }

  async findByNumber(rfqNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE rfq_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [rfqNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new RfqRepository();
