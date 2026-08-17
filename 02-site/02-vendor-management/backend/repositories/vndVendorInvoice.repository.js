'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class VndVendorInvoiceRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_VENDOR_INVOICE.name, pk: TABLES.VND_VENDOR_INVOICE.pk });
  }

  /** invoice_number is UNIQUE(vendor_id, invoice_number), not globally unique (doc §6.13) - two different vendors legitimately reuse the same numbering. */
  async findByVendorAndNumber(vendorId, invoiceNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE vendor_id = $1 AND invoice_number = $2 AND company_id = $3 AND deleted_at IS NULL`,
      [vendorId, invoiceNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new VndVendorInvoiceRepository();
