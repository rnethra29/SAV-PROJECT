'use strict';

const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');

/**
 * Shared data access for the three Lookup tables (architecture Phase 4
 * #18-20). Lookups are company-agnostic (shared master data), never
 * soft-deleted - `is_active` is the deactivation switch instead.
 */
class LookupRepository {
  /**
   * @param {{ name: string, pk: string }} table
   * @param {string} nameColumn
   */
  constructor(table, nameColumn) {
    this.table = table.name;
    this.pk = table.pk;
    this.nameColumn = nameColumn;
  }

  async findAll({ activeOnly = true } = {}) {
    const where = activeOnly ? 'WHERE is_active = true' : '';
    const orderCol = this.table === TABLES.ITEM_CATEGORY.name ? 'sequence_no' : this.nameColumn;
    const result = await query(`SELECT * FROM ${this.table} ${where} ORDER BY ${orderCol} ASC`);
    return result.rows;
  }

  async findById(id) {
    const result = await query(`SELECT * FROM ${this.table} WHERE ${this.pk} = $1`, [id]);
    return result.rows[0] || null;
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await query(
      `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update(id, data) {
    const columns = Object.keys(data);
    if (!columns.length) return this.findById(id);
    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);
    const values = Object.values(data);
    const hasUpdatedAt = this.table !== TABLES.PRICE_SOURCE_TYPE.name && this.table !== TABLES.DOCUMENT_CATEGORY.name;
    if (hasUpdatedAt) setClauses.push('updated_at = now()');
    values.push(id);
    const result = await query(
      `UPDATE ${this.table} SET ${setClauses.join(', ')} WHERE ${this.pk} = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deactivate(id) {
    return this.update(id, { is_active: false });
  }
}

const itemCategoryRepository = new LookupRepository(TABLES.ITEM_CATEGORY, 'category_name');
const priceSourceTypeRepository = new LookupRepository(TABLES.PRICE_SOURCE_TYPE, 'source_name');
const documentCategoryRepository = new LookupRepository(TABLES.DOCUMENT_CATEGORY, 'category_name');

module.exports = {
  LookupRepository,
  itemCategoryRepository,
  priceSourceTypeRepository,
  documentCategoryRepository,
};
