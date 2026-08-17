'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class ClmClientContactRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_CLIENT_CONTACT.name, pk: TABLES.CLM_CLIENT_CONTACT.pk });
  }

  async findByClientId(clientId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE client_id = $1 AND deleted_at IS NULL ORDER BY contact_name ASC`,
      [clientId]
    );
    return result.rows;
  }

  /** Backs the "one primary contact per (client_id, contact_type_id)" business rule (doc §6.4) with a friendly pre-check ahead of the DB's partial unique index. */
  async findPrimaryByType(clientId, contactTypeId, { excludeContactId, client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const params = [clientId, contactTypeId];
    let sql = `SELECT * FROM ${this.table} WHERE client_id = $1 AND contact_type_id = $2 AND is_primary_contact = true AND deleted_at IS NULL`;
    if (excludeContactId) {
      params.push(excludeContactId);
      sql += ` AND contact_id <> $${params.length}`;
    }
    const result = await exec(sql, params);
    return result.rows[0] || null;
  }
}

module.exports = new ClmClientContactRepository();
