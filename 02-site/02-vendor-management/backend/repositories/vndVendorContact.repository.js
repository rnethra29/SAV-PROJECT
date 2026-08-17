'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class VndVendorContactRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_VENDOR_CONTACT.name, pk: TABLES.VND_VENDOR_CONTACT.pk });
  }

  async findByVendorId(vendorId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE vendor_id = $1 AND deleted_at IS NULL ORDER BY contact_name ASC`,
      [vendorId]
    );
    return result.rows;
  }

  /** Exactly one primary contact per vendor (doc §6.7), unlike Client Management's per-department scoping. */
  async findPrimary(vendorId, { excludeContactId, client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const params = [vendorId];
    let sql = `SELECT * FROM ${this.table} WHERE vendor_id = $1 AND is_primary_contact = true AND deleted_at IS NULL`;
    if (excludeContactId) {
      params.push(excludeContactId);
      sql += ` AND vendor_contact_id <> $${params.length}`;
    }
    const result = await exec(sql, params);
    return result.rows[0] || null;
  }
}

module.exports = new VndVendorContactRepository();
