'use strict';

/**
 * Seeds the three Lookup tables. Idempotent (ON CONFLICT DO NOTHING against
 * each table's UNIQUE name column).
 *
 * A `created_by` (and for com_item_category, `updated_by`) FK to `users` is
 * required by schema. Provide it via SEED_USER_ID env var, or the script
 * will fall back to the first row of `users` it can find - fine for a fresh
 * dev/staging seed, not recommended for production.
 *
 * Usage: npm run seed
 */

const { pool, query } = require('../config/database');
const logger = require('../config/logger');
const { ITEM_CATEGORIES, PRICE_SOURCE_TYPES, DOCUMENT_CATEGORIES } = require('./seeds/001_lookup_data');

async function resolveSeedUserId() {
  if (process.env.SEED_USER_ID) return process.env.SEED_USER_ID;
  const result = await query('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
  if (!result.rows.length) {
    throw new Error(
      'No users found and SEED_USER_ID is not set. Create at least one user (external master table) or set SEED_USER_ID before seeding.'
    );
  }
  return result.rows[0].id;
}

async function seedItemCategories(userId) {
  for (const row of ITEM_CATEGORIES) {
    await query(
      `INSERT INTO com_item_category (category_name, sequence_no, created_by, updated_by)
       VALUES ($1, $2, $3, $3)
       ON CONFLICT (category_name) DO NOTHING`,
      [row.category_name, row.sequence_no, userId]
    );
  }
  logger.info(`[seed] com_item_category: ${ITEM_CATEGORIES.length} row(s) ensured`);
}

async function seedPriceSourceTypes(userId) {
  for (const row of PRICE_SOURCE_TYPES) {
    await query(
      `INSERT INTO com_price_source_type (source_name, created_by)
       VALUES ($1, $2)
       ON CONFLICT (source_name) DO NOTHING`,
      [row.source_name, userId]
    );
  }
  logger.info(`[seed] com_price_source_type: ${PRICE_SOURCE_TYPES.length} row(s) ensured`);
}

async function seedDocumentCategories(userId) {
  for (const row of DOCUMENT_CATEGORIES) {
    await query(
      `INSERT INTO com_document_category (category_name, created_by)
       VALUES ($1, $2)
       ON CONFLICT (category_name) DO NOTHING`,
      [row.category_name, userId]
    );
  }
  logger.info(`[seed] com_document_category: ${DOCUMENT_CATEGORIES.length} row(s) ensured`);
}

async function main() {
  try {
    const userId = await resolveSeedUserId();
    await seedItemCategories(userId);
    await seedPriceSourceTypes(userId);
    await seedDocumentCategories(userId);
    logger.info('[seed] done.');
  } catch (err) {
    logger.error('[seed] failed', { error: err.message });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
