'use strict';

const { query } = require('../../config/database');
const { TABLES } = require('../../models/tables');

const T = TABLES.APPROVALS.name;

/** One row per (entity_type, entity_id, approval_stage) - architecture Phase 8 rule #13. Created Pending, then mutated in place to Approved/Rejected (no updated_at column in the DDL - the approval decision itself, via `status`/`approved_at`, is the audit trail; see also com_audit_log for the generic before/after diff). */
class ApprovalRepository {
  async findById(id, companyId) {
    const result = await query(`SELECT * FROM ${T} WHERE approval_id = $1 AND company_id = $2`, [id, companyId]);
    return result.rows[0] || null;
  }

  async findByEntity(entityType, entityId) {
    const result = await query(`SELECT * FROM ${T} WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at ASC`, [entityType, entityId]);
    return result.rows;
  }

  async findPendingStage(entityType, entityId, stage) {
    const result = await query(
      `SELECT * FROM ${T} WHERE entity_type = $1 AND entity_id = $2 AND approval_stage = $3 AND status = 'Pending' LIMIT 1`,
      [entityType, entityId, stage]
    );
    return result.rows[0] || null;
  }

  async findApprovedStage(entityType, entityId, stage) {
    const result = await query(
      `SELECT * FROM ${T} WHERE entity_type = $1 AND entity_id = $2 AND approval_stage = $3 AND status = 'Approved' ORDER BY approved_at DESC LIMIT 1`,
      [entityType, entityId, stage]
    );
    return result.rows[0] || null;
  }

  async create(data, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await exec(`INSERT INTO ${T} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }

  async decide(id, { status, comments, rejectionReason }, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `UPDATE ${T} SET status = $1, approved_at = now(), comments = COALESCE($2, comments), rejection_reason = $3
       WHERE approval_id = $4 RETURNING *`,
      [status, comments || null, rejectionReason || null, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ApprovalRepository();
