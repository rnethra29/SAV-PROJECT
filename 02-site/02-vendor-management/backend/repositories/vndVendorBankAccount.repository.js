'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class VndVendorBankAccountRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_VENDOR_BANK_ACCOUNT.name, pk: TABLES.VND_VENDOR_BANK_ACCOUNT.pk });
  }

  async findByVendorId(vendorId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE vendor_id = $1 AND deleted_at IS NULL ORDER BY is_primary DESC, created_at ASC`,
      [vendorId]
    );
    return result.rows;
  }

  async findPrimary(vendorId, { excludeBankAccountId, client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const params = [vendorId];
    let sql = `SELECT * FROM ${this.table} WHERE vendor_id = $1 AND is_primary = true AND deleted_at IS NULL`;
    if (excludeBankAccountId) {
      params.push(excludeBankAccountId);
      sql += ` AND bank_account_id <> $${params.length}`;
    }
    const result = await exec(sql, params);
    return result.rows[0] || null;
  }
}

module.exports = new VndVendorBankAccountRepository();
