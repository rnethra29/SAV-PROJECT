'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class ClmPaymentRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_PAYMENT.name, pk: TABLES.CLM_PAYMENT.pk });
  }

  async findByReferenceNumber(referenceNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE payment_reference_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [referenceNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ClmPaymentRepository();
