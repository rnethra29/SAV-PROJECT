'use strict';

const BaseRepository = require('../../../shared/backend/repositories/base.repository');
const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');

class EstimationRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.ESTIMATION.name, pk: TABLES.ESTIMATION.pk });
  }

  async findByNumber(estimationNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE estimation_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [estimationNumber, companyId]
    );
    return result.rows[0] || null;
  }

  async findByRfqId(rfqId, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE rfq_id = $1 AND company_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [rfqId, companyId]
    );
    return result.rows;
  }
}

module.exports = new EstimationRepository();
