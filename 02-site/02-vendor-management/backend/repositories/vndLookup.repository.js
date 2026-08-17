'use strict';

const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

/**
 * Shared data access for the Vendor Management submodule's two Lookup
 * tables (vnd_vendor_type, vnd_material_category - architecture doc
 * §6.4/§6.5). Company-agnostic shared master data, never soft-deleted -
 * `is_active` is the deactivation switch instead. Mirrors
 * src/repositories/clmLookup.repository.js.
 */
class VndLookupRepository {
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
    const result = await query(`SELECT * FROM ${this.table} ${where} ORDER BY ${this.nameColumn} ASC`);
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

const vendorTypeRepository = new VndLookupRepository(TABLES.VND_VENDOR_TYPE, 'type_name');
const materialCategoryRepository = new VndLookupRepository(TABLES.VND_MATERIAL_CATEGORY, 'category_name');

module.exports = { VndLookupRepository, vendorTypeRepository, materialCategoryRepository };
