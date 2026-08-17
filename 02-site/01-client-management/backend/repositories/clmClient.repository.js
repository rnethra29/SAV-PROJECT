'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class ClmClientRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_CLIENT.name, pk: TABLES.CLM_CLIENT.pk });
  }

  async findByCode(clientCode, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE client_code = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [clientCode, companyId]
    );
    return result.rows[0] || null;
  }

  async findByGstin(gstin, companyId) {
    if (!gstin) return null;
    const result = await query(
      `SELECT * FROM ${this.table} WHERE gstin = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [gstin, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ClmClientRepository();
