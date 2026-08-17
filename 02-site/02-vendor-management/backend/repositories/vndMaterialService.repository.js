'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

/** No deleted_at column (doc §6.9 - CORE_NO_SOFT_DELETE); `is_active` is the deactivation switch for catalog items. */
class VndMaterialServiceRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_MATERIAL_SERVICE.name, pk: TABLES.VND_MATERIAL_SERVICE.pk, softDelete: false });
  }

  async findByVendorId(vendorId, { activeOnly = true, client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const params = [vendorId];
    let sql = `SELECT * FROM ${this.table} WHERE vendor_id = $1`;
    if (activeOnly) sql += ' AND is_active = true';
    sql += ' ORDER BY item_name ASC';
    const result = await exec(sql, params);
    return result.rows;
  }
}

module.exports = new VndMaterialServiceRepository();
