'use strict';

const { v4: uuidv4 } = require('uuid');
const documentRepository = require('../repositories/document.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');
const { supabaseAdmin } = require('../config/supabase');
const env = require('../config/env');
const logger = require('../config/logger');

/** entity_type -> {table, pk} used to verify the polymorphic target actually exists before attaching a document (architecture Phase 5.15/5.16 use entity_type+entity_id, not a per-entity FK). */
const ENTITY_TABLE_MAP = {
  RFQ: { table: 'com_rfq', pk: 'rfq_id' },
  Estimation: { table: 'com_estimation', pk: 'estimation_id' },
  Quotation: { table: 'com_quotation', pk: 'quotation_id' },
  Negotiation: { table: 'com_negotiation_offers', pk: 'offer_id' },
  ClientOffer: { table: 'com_negotiation_offers', pk: 'offer_id' },
  BOQ: { table: 'com_boq', pk: 'boq_id' },
  PO: { table: 'com_po', pk: 'po_id' },
  // Sites module -> Client Management submodule (com_documents extended, not duplicated - doc §16)
  Client: { table: 'clm_client', pk: 'client_id' },
  ClientContact: { table: 'clm_client_contact', pk: 'contact_id' },
  ClientRequirement: { table: 'clm_client_requirement', pk: 'requirement_id' },
  ClientInvoice: { table: 'clm_client_invoice', pk: 'invoice_id' },
  ClientPayment: { table: 'clm_payment', pk: 'payment_id' },
};

async function assertEntityExists(entityType, entityId, companyId) {
  const target = ENTITY_TABLE_MAP[entityType];
  if (!target) throw ApiError.badRequest(`Unknown entity_type '${entityType}'`);
  const hasCompanyCol = !['Negotiation', 'ClientOffer'].includes(entityType) || true; // all mapped tables carry company_id
  const result = await query(`SELECT 1 FROM ${target.table} WHERE ${target.pk} = $1 AND company_id = $2 LIMIT 1`, [entityId, companyId]);
  if (result.rowCount === 0) throw ApiError.badRequest(`${entityType} with id ${entityId} does not exist`);
}

async function listByEntity(entityType, entityId, user, { activeOnly = true } = {}) {
  await assertEntityExists(entityType, entityId, user.companyId);
  return documentRepository.findByEntity(entityType, entityId, { activeOnly });
}

async function getById(id, user) {
  const doc = await documentRepository.findById(id, { companyId: user.companyId });
  if (!doc) throw ApiError.notFound('Document not found');
  return doc;
}

/**
 * Uploads a new document (architecture Phase 12): private bucket, path
 * `{entity_type}/{entity_id}/{document_id}_{file_name}`. If
 * `previousVersionId` is given, the prior row is marked `Superseded` (its
 * Storage object is retained, never deleted - Phase 8 rule #8) and the new
 * row links back via `previous_version_id` with `version_no + 1`.
 */
async function upload({ entityType, entityId, documentCategoryId, description, file, previousVersionId }, user) {
  await assertEntityExists(entityType, entityId, user.companyId);

  let versionNo = 1;
  let previousDoc = null;
  if (previousVersionId) {
    previousDoc = await documentRepository.findById(previousVersionId, { companyId: user.companyId });
    if (!previousDoc) throw ApiError.badRequest('previousVersionId does not exist');
    if (previousDoc.entity_type !== entityType || previousDoc.entity_id !== entityId) {
      throw ApiError.badRequest('previousVersionId must belong to the same entity_type/entity_id');
    }
    const childExists = await documentRepository.findChildVersion(previousVersionId);
    if (childExists) throw ApiError.conflict('previousVersionId already has a newer version', { code: 'STALE_VERSION' });
    versionNo = previousDoc.version_no + 1;
  }

  const documentId = uuidv4();
  const safeFileName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const storagePath = `${entityType}/${entityId}/${documentId}_${safeFileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(env.documents.bucket)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadError) {
    logger.error('[documents] Supabase Storage upload failed', { error: uploadError.message, storagePath });
    throw ApiError.internal('Failed to upload file to storage', { details: uploadError.message });
  }

  try {
    return await transaction(async (client) => {
      const doc = await documentRepository.create(
        {
          document_id: documentId,
          entity_type: entityType,
          entity_id: entityId,
          document_category_id: documentCategoryId,
          file_name: file.originalname,
          file_type: (file.originalname.split('.').pop() || '').toLowerCase(),
          mime_type: file.mimetype,
          file_size_bytes: file.size,
          storage_bucket: env.documents.bucket,
          storage_path: storagePath,
          version_no: versionNo,
          previous_version_id: previousVersionId || null,
          status: 'Active',
          description: description || null,
          company_id: user.companyId,
          branch_id: user.branchId,
          created_by: user.id,
          updated_by: user.id,
        },
        { client }
      );

      if (previousDoc) {
        await documentRepository.update(previousDoc.document_id, { status: 'Superseded' }, { companyId: user.companyId, userId: user.id, client });
      }

      await auditService.log({ entityType, entityId, action: 'Insert', userId: user.id, newValue: { document: doc } }, client);
      return doc;
    });
  } catch (err) {
    // Best-effort cleanup of the orphaned Storage object if the DB write failed.
    await supabaseAdmin.storage.from(env.documents.bucket).remove([storagePath]).catch(() => {});
    throw err;
  }
}

/** Time-limited signed URL - buckets are private, never served via public bucket URLs (architecture Phase 12). */
async function getSignedUrl(id, user) {
  const doc = await getById(id, user);
  const { data, error } = await supabaseAdmin.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, env.documents.signedUrlExpirySeconds);

  if (error) {
    logger.error('[documents] failed to create signed URL', { error: error.message, documentId: id });
    throw ApiError.internal('Failed to generate signed URL', { details: error.message });
  }
  return { url: data.signedUrl, expiresInSeconds: env.documents.signedUrlExpirySeconds, document: doc };
}

/** Never a hard delete (architecture Phase 8 rule #8) - the Storage object is retained, only the metadata status changes. */
async function archive(id, user) {
  const doc = await getById(id, user);
  return transaction(async (client) => {
    const updated = await documentRepository.update(id, { status: 'Archived' }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: doc.entity_type, entityId: doc.entity_id, action: 'Update', userId: user.id, oldValue: doc, newValue: updated }, client);
    return updated;
  });
}

module.exports = { listByEntity, getById, upload, getSignedUrl, archive };
