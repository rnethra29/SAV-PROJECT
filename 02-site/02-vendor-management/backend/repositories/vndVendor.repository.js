'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class VndVendorRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_VENDOR.name, pk: TABLES.VND_VENDOR.pk });
  }

  async findByCode(vendorCode, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE vendor_code = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [vendorCode, companyId]
    );
    return result.rows[0] || null;
  }

  async findByGst(gstNumber, companyId) {
    if (!gstNumber) return null;
    const result = await query(
      `SELECT * FROM ${this.table} WHERE gst_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [gstNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new VndVendorRepository();
