'use strict';

const vndPurchaseOrderRepository = require('../repositories/vndPurchaseOrder.repository');
const vndPurchaseOrderItemRepository = require('../repositories/vndPurchaseOrderItem.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const clmProjectRepository = require('../repositories/clmProject.repository');
const approvalService = require('../../../../shared/backend/documents-approvals-audit/services/approval.service');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction, query } = require('../../../../shared/backend/config/database');
const { VND_PO_TRANSITIONS, VND_PO_APPROVAL_STATUS_TRANSITIONS, isValidTransition } = require('../../../../shared/backend/models/statusTransitions');
const { APPROVAL_STAGES } = require('../../../../shared/backend/models/approvalStages');

async function list(user, reqQuery) {
  return vndPurchaseOrderRepository.findAll({
    companyId: user.companyId,
    filters: { project_id: reqQuery.projectId, vendor_id: reqQuery.vendorId, status: reqQuery.status },
    allowedSort: ['po_number', 'po_date', 'status', 'total_amount', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const po = await vndPurchaseOrderRepository.findById(id, { companyId: user.companyId });
  if (!po) throw ApiError.notFound('Purchase order not found');
  return po;
}

/** Header-only creation (Draft) - subtotal/tax/total start at 0 and are trigger-maintained the moment items are added (doc §6.11, trg_vnd_po_totals). */
async function create(data, user) {
  const project = await clmProjectRepository.findById(data.project_id, { companyId: user.companyId });
  if (!project) throw ApiError.badRequest('project_id does not exist');
  const vendor = await vndVendorRepository.findById(data.vendor_id, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');

  const existing = await vndPurchaseOrderRepository.findByNumber(data.po_number, user.companyId);
  if (existing) throw ApiError.conflict(`PO number '${data.po_number}' already exists`);

  return transaction(async (client) => {
    const po = await vndPurchaseOrderRepository.create(
      { ...data, status: 'Draft', approval_status: 'Not Required', company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'ProcurementPO', entityId: po.po_id, action: 'Insert', userId: user.id, newValue: po }, client);
    return po;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  if (data.status && !isValidTransition(VND_PO_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid PO status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  return transaction(async (client) => {
    const updated = await vndPurchaseOrderRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Purchase order not found');
    await auditService.log(
      { entityType: 'ProcurementPO', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

/** Draft -> Pending Approval, requires at least one line item (doc §13's chain starts here). */
async function submit(id, user) {
  const existing = await getById(id, user);
  const items = await vndPurchaseOrderItemRepository.findByPoId(id);
  if (!items.length) throw ApiError.badRequest('Cannot submit a PO with no line items');
  if (!isValidTransition(VND_PO_TRANSITIONS, existing.status, 'Pending Approval')) {
    throw ApiError.badRequest(`Invalid PO status transition: '${existing.status}' -> 'Pending Approval'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  return transaction(async (client) => {
    const updated = await vndPurchaseOrderRepository.update(id, { status: 'Pending Approval', approval_status: 'Pending' }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ProcurementPO', entityId: id, action: 'Submit', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

const STAGE_MAP = {
  Manager: { approvalStage: APPROVAL_STAGES.PROCUREMENT_PO_MANAGER, resultStatus: 'Manager Approved', requiredCurrent: 'Pending' },
  Finance: { approvalStage: APPROVAL_STAGES.PROCUREMENT_PO_FINANCE, resultStatus: 'Finance Approved', requiredCurrent: 'Manager Approved' },
};

/**
 * Two-stage approval chain (doc §13): Manager then Finance. Each call
 * requires a matching Approved `com_approvals` row already on record for
 * this stage (the reusable `approvalService.isApproved` gate, same pattern
 * as every other module) - this endpoint is what advances the PO's own
 * denormalized `approval_status` display column once that record exists,
 * and on the Finance stage also advances `status` to 'Approved'.
 */
async function decideApprovalStage(id, stage, user) {
  const mapping = STAGE_MAP[stage];
  if (!mapping) throw ApiError.badRequest(`Unknown approval stage '${stage}' - expected 'Manager' or 'Finance'`);

  const existing = await getById(id, user);
  if (existing.approval_status !== mapping.requiredCurrent) {
    throw ApiError.conflict(`PO approval_status must be '${mapping.requiredCurrent}' before the ${stage} stage can be recorded (currently '${existing.approval_status}')`, { code: 'INVALID_STATUS_TRANSITION' });
  }
  if (!(await approvalService.isApproved('ProcurementPO', id, mapping.approvalStage))) {
    throw ApiError.conflict(`PO cannot advance without an Approved '${mapping.approvalStage}' record`, { code: 'APPROVAL_REQUIRED' });
  }
  if (!isValidTransition(VND_PO_APPROVAL_STATUS_TRANSITIONS, existing.approval_status, mapping.resultStatus)) {
    throw ApiError.badRequest(`Invalid PO approval_status transition: '${existing.approval_status}' -> '${mapping.resultStatus}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  const payload = { approval_status: mapping.resultStatus };
  if (stage === 'Finance') payload.status = 'Approved';

  return transaction(async (client) => {
    const updated = await vndPurchaseOrderRepository.update(id, payload, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ProcurementPO', entityId: id, action: 'Approve', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

/** Goods receipt (doc §18: POST /purchase-orders/:poId/receive). Updates received_quantity per item and rolls the header status up to 'Partially Received' or 'Received'. */
async function receive(id, items, user) {
  const existing = await getById(id, user);
  if (!['Sent to Vendor', 'Partially Received'].includes(existing.status)) {
    throw ApiError.conflict(`Goods can only be received against a PO in 'Sent to Vendor' or 'Partially Received' status (currently '${existing.status}')`, { code: 'PO_NOT_RECEIVABLE' });
  }

  return transaction(async (client) => {
    for (const line of items) {
      const item = await vndPurchaseOrderItemRepository.findById(line.poItemId, { client });
      if (!item || item.po_id !== id) throw ApiError.badRequest(`po_item_id ${line.poItemId} does not belong to this PO`);
      if (line.receivedQuantity < 0 || line.receivedQuantity > Number(item.quantity)) {
        throw ApiError.badRequest(`receivedQuantity for ${line.poItemId} must be between 0 and ${item.quantity}`);
      }
      await vndPurchaseOrderItemRepository.update(line.poItemId, { received_quantity: line.receivedQuantity }, { companyId: user.companyId, userId: user.id, client });
    }

    const allItems = await vndPurchaseOrderItemRepository.findByPoId(id, { client });
    const fullyReceived = allItems.every((i) => Number(i.received_quantity) >= Number(i.quantity));
    const partiallyReceived = allItems.some((i) => Number(i.received_quantity) > 0);
    const newStatus = fullyReceived ? 'Received' : partiallyReceived ? 'Partially Received' : existing.status;

    const updated = await vndPurchaseOrderRepository.update(id, { status: newStatus }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ProcurementPO', entityId: id, action: 'Update', userId: user.id, oldValue: existing, newValue: { status: newStatus, receipt: items } }, client);
    return updated;
  });
}

async function cancel(id, user) {
  const existing = await getById(id, user);
  if (!isValidTransition(VND_PO_TRANSITIONS, existing.status, 'Cancelled')) {
    throw ApiError.conflict(`PO in status '${existing.status}' cannot be cancelled`, { code: 'INVALID_STATUS_TRANSITION' });
  }
  return transaction(async (client) => {
    const updated = await vndPurchaseOrderRepository.update(id, { status: 'Cancelled' }, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ProcurementPO', entityId: id, action: 'Cancel', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const invoiceResult = await query(`SELECT 1 FROM vnd_vendor_invoice WHERE purchase_order_id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
  if (invoiceResult.rowCount > 0) throw ApiError.conflict('Cannot delete a PO already referenced by a vendor invoice', { code: 'HAS_DEPENDENTS' });

  return transaction(async (client) => {
    const deleted = await vndPurchaseOrderRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ProcurementPO', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, submit, decideApprovalStage, receive, cancel, remove };
