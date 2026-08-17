'use strict';

const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

const T = TABLES.VND_VENDOR_RATING.name;

/** Append-only (doc §6.10): a rating is a point-in-time opinion, corrected by a new rating, never edited in place. */
class VndVendorRatingRepository {
  async findById(id) {
    const result = await query(`SELECT * FROM ${T} WHERE rating_id = $1`, [id]);
    return result.rows[0] || null;
  }

  async findByVendorId(vendorId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${T} WHERE vendor_id = $1 ORDER BY rated_at DESC`, [vendorId]);
    return result.rows;
  }

  async create(data, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await exec(`INSERT INTO ${T} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }
}

module.exports = new VndVendorRatingRepository();
