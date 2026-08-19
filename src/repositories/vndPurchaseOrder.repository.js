'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class VndPurchaseOrderRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_PURCHASE_ORDER.name, pk: TABLES.VND_PURCHASE_ORDER.pk });
  }

  async findByNumber(poNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE po_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [poNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new VndPurchaseOrderRepository();
