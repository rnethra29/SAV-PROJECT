'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

/** No deleted_at column (doc §6.15 - CORE_NO_SOFT_DELETE); a payment record, once made, is corrected via a reversing payment/allocation, not deleted. */
class VndVendorPaymentRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_VENDOR_PAYMENT.name, pk: TABLES.VND_VENDOR_PAYMENT.pk, softDelete: false });
  }

  async findByReferenceNumber(referenceNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE payment_reference_number = $1 AND company_id = $2`,
      [referenceNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new VndVendorPaymentRepository();
