'use strict';

const { query } = require('../../../backend/config/database');
const { TABLES } = require('../../../backend/models/tables');

const ROLE = TABLES.SEC_ROLE.name;
const PERMISSION = TABLES.SEC_PERMISSION.name;
const ROLE_PERMISSION = TABLES.SEC_ROLE_PERMISSION.name;
const USER_ROLE = TABLES.SEC_USER_ROLE.name;

/**
 * RBAC data access (architecture doc §14) - four small, mostly-global
 * tables kept in one file since they're only ever used together. Classic
 * many-to-many both directions: user <-sec_user_role-> role
 * <-sec_role_permission-> permission. Nothing here is company-scoped by
 * design (roles/permissions are shared vocabulary across the whole ERP,
 * same as com_item_category); the *assignment* rows (sec_user_role) are
 * effectively scoped by which user they name.
 */
class SecRoleRepository {
  async findAll({ activeOnly = true } = {}) {
    const where = activeOnly ? 'WHERE is_active = true' : '';
    const result = await query(`SELECT * FROM ${ROLE} ${where} ORDER BY role_name ASC`);
    return result.rows;
  }

  async findById(id) {
    const result = await query(`SELECT * FROM ${ROLE} WHERE role_id = $1`, [id]);
    return result.rows[0] || null;
  }

  async findByName(roleName) {
    const result = await query(`SELECT * FROM ${ROLE} WHERE role_name = $1`, [roleName]);
    return result.rows[0] || null;
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await query(`INSERT INTO ${ROLE} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }

  async update(id, data) {
    const columns = Object.keys(data);
    if (!columns.length) return this.findById(id);
    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);
    const values = Object.values(data);
    values.push(id);
    const result = await query(`UPDATE ${ROLE} SET ${setClauses.join(', ')} WHERE role_id = $${values.length} RETURNING *`, values);
    return result.rows[0] || null;
  }

  async deactivate(id) {
    return this.update(id, { is_active: false });
  }
}

class SecPermissionRepository {
  async findAll({ module } = {}) {
    const params = [];
    let sql = `SELECT * FROM ${PERMISSION}`;
    if (module) {
      params.push(module);
      sql += ` WHERE module = $1`;
    }
    sql += ' ORDER BY module ASC, permission_code ASC';
    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id) {
    const result = await query(`SELECT * FROM ${PERMISSION} WHERE permission_id = $1`, [id]);
    return result.rows[0] || null;
  }

  async findByCode(permissionCode) {
    const result = await query(`SELECT * FROM ${PERMISSION} WHERE permission_code = $1`, [permissionCode]);
    return result.rows[0] || null;
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await query(`INSERT INTO ${PERMISSION} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }
}

class SecRolePermissionRepository {
  async findByRoleId(roleId) {
    const result = await query(
      `SELECT rp.*, p.permission_code, p.module, p.description
       FROM ${ROLE_PERMISSION} rp JOIN ${PERMISSION} p ON p.permission_id = rp.permission_id
       WHERE rp.role_id = $1 ORDER BY p.module ASC, p.permission_code ASC`,
      [roleId]
    );
    return result.rows;
  }

  async exists(roleId, permissionId) {
    const result = await query(`SELECT 1 FROM ${ROLE_PERMISSION} WHERE role_id = $1 AND permission_id = $2 LIMIT 1`, [roleId, permissionId]);
    return result.rowCount > 0;
  }

  async grant(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await query(`INSERT INTO ${ROLE_PERMISSION} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }

  async revoke(roleId, permissionId) {
    const result = await query(`DELETE FROM ${ROLE_PERMISSION} WHERE role_id = $1 AND permission_id = $2 RETURNING *`, [roleId, permissionId]);
    return result.rows[0] || null;
  }
}

class SecUserRoleRepository {
  async findByUserId(userId) {
    const result = await query(
      `SELECT ur.*, r.role_name, r.description
       FROM ${USER_ROLE} ur JOIN ${ROLE} r ON r.role_id = ur.role_id
       WHERE ur.user_id = $1 ORDER BY r.role_name ASC`,
      [userId]
    );
    return result.rows;
  }

  async exists(userId, roleId) {
    const result = await query(`SELECT 1 FROM ${USER_ROLE} WHERE user_id = $1 AND role_id = $2 LIMIT 1`, [userId, roleId]);
    return result.rowCount > 0;
  }

  async assign(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await query(`INSERT INTO ${USER_ROLE} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }

  async unassign(userId, roleId) {
    const result = await query(`DELETE FROM ${USER_ROLE} WHERE user_id = $1 AND role_id = $2 RETURNING *`, [userId, roleId]);
    return result.rows[0] || null;
  }

  /** Every permission_code granted to a user across all of their roles - the hot-path check for authorization (doc §14/§20: "every state-changing endpoint checks sec_role_permission before executing"). */
  async findPermissionCodesForUser(userId) {
    const result = await query(
      `SELECT DISTINCT p.permission_code
       FROM ${USER_ROLE} ur
       JOIN ${ROLE_PERMISSION} rp ON rp.role_id = ur.role_id
       JOIN ${PERMISSION} p ON p.permission_id = rp.permission_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows.map((r) => r.permission_code);
  }
}

module.exports = {
  roleRepository: new SecRoleRepository(),
  permissionRepository: new SecPermissionRepository(),
  rolePermissionRepository: new SecRolePermissionRepository(),
  userRoleRepository: new SecUserRoleRepository(),
};
