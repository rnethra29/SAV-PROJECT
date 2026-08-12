'use strict';

const clmPaymentAllocationRepository = require('../repositories/clmPaymentAllocation.repository');
const clmPaymentRepository = require('../repositories/clmPayment.repository');
const clmClientInvoiceRepository = require('../repositories/clmClientInvoice.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

async function listByPayment(paymentId, user) {
  const payment = await clmPaymentRepository.findById(paymentId, { companyId: user.companyId });
  if (!payment) throw ApiError.notFound('Payment not found');
  return clmPaymentAllocationRepository.findByPaymentId(paymentId);
}

async function listByInvoice(invoiceId, user) {
  const invoice = await clmClientInvoiceRepository.findById(invoiceId, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Client invoice not found');
  return clmPaymentAllocationRepository.findByInvoiceId(invoiceId);
}

/**
 * Append-only (architecture doc §6.10) - the SUM-across-rows guards against
 * over-allocating past the payment amount or the invoice net amount live in
 * the `clm_fn_check_allocation` DB trigger (defense-in-depth against races);
 * this also does the same checks up front for a fast, friendly error.
 */
async function create(data, user) {
  const payment = await clmPaymentRepository.findById(data.payment_id, { companyId: user.companyId });
  if (!payment) throw ApiError.badRequest('payment_id does not exist');
  const invoice = await clmClientInvoiceRepository.findById(data.invoice_id, { companyId: user.companyId });
  if (!invoice) throw ApiError.badRequest('invoice_id does not exist');

  if (payment.client_id !== invoice.client_id) {
    throw ApiError.badRequest('payment_id and invoice_id must belong to the same client');
  }

  const [paymentAllocations, invoiceAllocations] = await Promise.all([
    clmPaymentAllocationRepository.findByPaymentId(data.payment_id),
    clmPaymentAllocationRepository.findByInvoiceId(data.invoice_id),
  ]);
  const paymentAllocated = paymentAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);
  const invoiceAllocated = invoiceAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);

  if (paymentAllocated + Number(data.allocated_amount) > Number(payment.amount)) {
    throw ApiError.conflict('Allocated amount would exceed this payment\'s total amount', { code: 'ALLOCATION_EXCEEDS_PAYMENT' });
  }
  if (invoiceAllocated + Number(data.allocated_amount) > Number(invoice.net_amount)) {
    throw ApiError.conflict('Allocated amount would exceed this invoice\'s net amount', { code: 'ALLOCATION_EXCEEDS_INVOICE' });
  }

  return transaction(async (client) => {
    const allocation = await clmPaymentAllocationRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id },
      { client }
    );
    await auditService.log(
      { entityType: 'ClientPayment', entityId: data.payment_id, action: 'Insert', userId: user.id, newValue: { allocation_created: allocation } },
      client
    );
    await auditService.log(
      { entityType: 'ClientInvoice', entityId: data.invoice_id, action: 'Insert', userId: user.id, newValue: { allocation_created: allocation } },
      client
    );
    return allocation;
  });
}

module.exports = { listByPayment, listByInvoice, create };
