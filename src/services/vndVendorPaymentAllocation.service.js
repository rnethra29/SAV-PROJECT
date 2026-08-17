'use strict';

const vndVendorPaymentAllocationRepository = require('../repositories/vndVendorPaymentAllocation.repository');
const vndVendorPaymentRepository = require('../repositories/vndVendorPayment.repository');
const vndVendorInvoiceRepository = require('../repositories/vndVendorInvoice.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

async function listByPayment(paymentId, user) {
  const payment = await vndVendorPaymentRepository.findById(paymentId, { companyId: user.companyId });
  if (!payment) throw ApiError.notFound('Vendor payment not found');
  return vndVendorPaymentAllocationRepository.findByPaymentId(paymentId);
}

async function listByInvoice(invoiceId, user) {
  const invoice = await vndVendorInvoiceRepository.findById(invoiceId, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Vendor invoice not found');
  return vndVendorPaymentAllocationRepository.findByInvoiceId(invoiceId);
}

/**
 * Refreshes `clm_project_expense.payment_status` for every expense row tied
 * to this vendor invoice, once its balance has moved (architecture doc
 * §6.3 design note: "written by application logic whenever a
 * vnd_vendor_payment_allocation row is inserted/reversed against this
 * expense's linked invoice - not a free-standing source of truth").
 */
async function syncExpensePaymentStatus(vendorInvoiceId, client) {
  const invoiceResult = await client.query(`SELECT total_amount FROM vnd_vendor_invoice WHERE vendor_invoice_id = $1`, [vendorInvoiceId]);
  const invoice = invoiceResult.rows[0];
  if (!invoice) return;

  const allocatedResult = await client.query(
    `SELECT COALESCE(SUM(allocated_amount), 0) AS allocated FROM vnd_vendor_payment_allocation WHERE vendor_invoice_id = $1`,
    [vendorInvoiceId]
  );
  const allocated = Number(allocatedResult.rows[0].allocated);
  const total = Number(invoice.total_amount);

  const paymentStatus = allocated >= total ? 'Paid' : allocated > 0 ? 'Partially Paid' : 'Unpaid';
  await client.query(`UPDATE clm_project_expense SET payment_status = $1, updated_at = now() WHERE vendor_invoice_id = $2`, [paymentStatus, vendorInvoiceId]);
}

/**
 * Append-only (doc §6.16) - the SUM-across-rows guards against
 * over-allocating past the payment amount or the invoice total live in the
 * `vnd_fn_check_allocation` DB trigger (defense-in-depth against races);
 * this also does the same checks up front for a fast, friendly error.
 */
async function create(data, user) {
  const payment = await vndVendorPaymentRepository.findById(data.vendor_payment_id, { companyId: user.companyId });
  if (!payment) throw ApiError.badRequest('vendor_payment_id does not exist');
  const invoice = await vndVendorInvoiceRepository.findById(data.vendor_invoice_id, { companyId: user.companyId });
  if (!invoice) throw ApiError.badRequest('vendor_invoice_id does not exist');

  if (payment.vendor_id !== invoice.vendor_id) {
    throw ApiError.badRequest('vendor_payment_id and vendor_invoice_id must belong to the same vendor');
  }

  const [paymentAllocations, invoiceAllocations] = await Promise.all([
    vndVendorPaymentAllocationRepository.findByPaymentId(data.vendor_payment_id),
    vndVendorPaymentAllocationRepository.findByInvoiceId(data.vendor_invoice_id),
  ]);
  const paymentAllocated = paymentAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);
  const invoiceAllocated = invoiceAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);

  if (paymentAllocated + Number(data.allocated_amount) > Number(payment.amount)) {
    throw ApiError.conflict("Allocated amount would exceed this payment's total amount", { code: 'ALLOCATION_EXCEEDS_PAYMENT' });
  }
  if (invoiceAllocated + Number(data.allocated_amount) > Number(invoice.total_amount)) {
    throw ApiError.conflict("Allocated amount would exceed this vendor invoice's total amount", { code: 'ALLOCATION_EXCEEDS_INVOICE' });
  }

  return transaction(async (client) => {
    const allocation = await vndVendorPaymentAllocationRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id },
      { client }
    );
    await syncExpensePaymentStatus(data.vendor_invoice_id, client);
    await auditService.log(
      { entityType: 'VendorPayment', entityId: data.vendor_payment_id, action: 'Payment', userId: user.id, newValue: { allocation_created: allocation } },
      client
    );
    await auditService.log(
      { entityType: 'VendorInvoice', entityId: data.vendor_invoice_id, action: 'Payment', userId: user.id, newValue: { allocation_created: allocation } },
      client
    );
    return allocation;
  });
}

module.exports = { listByPayment, listByInvoice, create };
