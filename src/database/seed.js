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
const { CLIENT_TYPES, INDUSTRIES, CONTACT_TYPES } = require('./seeds/002_client_management_lookup_data');
const { VENDOR_TYPES, MATERIAL_CATEGORIES } = require('./seeds/003_vendor_procurement_lookup_data');
const { ROLES: RBAC_ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('./seeds/004_rbac_seed_data');

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

async function seedClmClientTypes(userId) {
  for (const row of CLIENT_TYPES) {
    await query(`INSERT INTO clm_client_type (type_name, created_by) VALUES ($1, $2) ON CONFLICT (type_name) DO NOTHING`, [row.type_name, userId]);
  }
  logger.info(`[seed] clm_client_type: ${CLIENT_TYPES.length} row(s) ensured`);
}

async function seedClmIndustries(userId) {
  for (const row of INDUSTRIES) {
    await query(`INSERT INTO clm_industry (industry_name, created_by) VALUES ($1, $2) ON CONFLICT (industry_name) DO NOTHING`, [row.industry_name, userId]);
  }
  logger.info(`[seed] clm_industry: ${INDUSTRIES.length} row(s) ensured`);
}

async function seedClmContactTypes(userId) {
  for (const row of CONTACT_TYPES) {
    await query(`INSERT INTO clm_contact_type (type_name, created_by) VALUES ($1, $2) ON CONFLICT (type_name) DO NOTHING`, [row.type_name, userId]);
  }
  logger.info(`[seed] clm_contact_type: ${CONTACT_TYPES.length} row(s) ensured`);
}

async function seedVndVendorTypes(userId) {
  for (const row of VENDOR_TYPES) {
    await query(`INSERT INTO vnd_vendor_type (type_name, created_by) VALUES ($1, $2) ON CONFLICT (type_name) DO NOTHING`, [row.type_name, userId]);
  }
  logger.info(`[seed] vnd_vendor_type: ${VENDOR_TYPES.length} row(s) ensured`);
}

async function seedVndMaterialCategories(userId) {
  for (const row of MATERIAL_CATEGORIES) {
    await query(`INSERT INTO vnd_material_category (category_name, created_by) VALUES ($1, $2) ON CONFLICT (category_name) DO NOTHING`, [row.category_name, userId]);
  }
  logger.info(`[seed] vnd_material_category: ${MATERIAL_CATEGORIES.length} row(s) ensured`);
}

/** Baseline RBAC (doc §14/§17): 10 roles, a representative permission set, and the grants mapping between them - all idempotent (ON CONFLICT DO NOTHING). */
async function seedRbac(userId) {
  for (const row of RBAC_ROLES) {
    await query(`INSERT INTO sec_role (role_name, created_by) VALUES ($1, $2) ON CONFLICT (role_name) DO NOTHING`, [row.role_name, userId]);
  }
  logger.info(`[seed] sec_role: ${RBAC_ROLES.length} row(s) ensured`);

  for (const row of PERMISSIONS) {
    await query(
      `INSERT INTO sec_permission (permission_code, module, description, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (permission_code) DO NOTHING`,
      [row.permission_code, row.module, row.description, userId]
    );
  }
  logger.info(`[seed] sec_permission: ${PERMISSIONS.length} row(s) ensured`);

  let grantCount = 0;
  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permissionCode of permissionCodes) {
      await query(
        `INSERT INTO sec_role_permission (role_id, permission_id, created_by)
         SELECT r.role_id, p.permission_id, $3 FROM sec_role r, sec_permission p
         WHERE r.role_name = $1 AND p.permission_code = $2
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleName, permissionCode, userId]
      );
      grantCount += 1;
    }
  }
  logger.info(`[seed] sec_role_permission: ${grantCount} grant(s) ensured`);
}

async function main() {
  try {
    const userId = await resolveSeedUserId();
    await seedItemCategories(userId);
    await seedPriceSourceTypes(userId);
    await seedDocumentCategories(userId);
    await seedClmClientTypes(userId);
    await seedClmIndustries(userId);
    await seedClmContactTypes(userId);
    await seedVndVendorTypes(userId);
    await seedVndMaterialCategories(userId);
    await seedRbac(userId);
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
