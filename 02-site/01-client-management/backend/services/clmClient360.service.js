'use strict';

const clmClientRepository = require('../repositories/clmClient.repository');
const clmClient360Repository = require('../repositories/clmClient360.repository');
const clmClientContactRepository = require('../repositories/clmClientContact.repository');
const clmClientRequirementRepository = require('../repositories/clmClientRequirement.repository');
const clmClientInvoiceRepository = require('../repositories/clmClientInvoice.repository');
const clmPaymentRepository = require('../repositories/clmPayment.repository');
const rfqRepository = require('../../../../01-commercial-lifecycle/backend/rfq/rfq.repository');
const ApiError = require('../../../../shared/backend/utils/apiError');

async function assertClientExists(clientId, user) {
  const clientRow = await clmClientRepository.findById(clientId, { companyId: user.companyId });
  if (!clientRow) throw ApiError.notFound('Client not found');
  return clientRow;
}

/**
 * Assembles the full Client 360 profile entirely from the views defined in
 * 019_clm_views.sql (architecture doc §18: `GET /api/clients/:clientId/360
 * -> assembled from the views in §11/§13`) - nothing here is a new
 * source-of-truth, every figure is read straight off a view.
 */
async function getOverview(clientId, user) {
  await assertClientExists(clientId, user);

  const [overview, financialSummary, projects, rfqHistory, boqSummary, poSummary, billingSummary, paymentSummary, outstanding, costUtilization, profitAnalysis] =
    await Promise.all([
      clmClient360Repository.overview(clientId),
      clmClient360Repository.financialSummary(clientId),
      clmClient360Repository.projects(clientId),
      clmClient360Repository.rfqHistory(clientId),
      clmClient360Repository.boqSummary(clientId),
      clmClient360Repository.poSummary(clientId),
      clmClient360Repository.billingSummary(clientId),
      clmClient360Repository.paymentSummary(clientId),
      clmClient360Repository.outstanding(clientId),
      clmClient360Repository.costUtilization(clientId),
      clmClient360Repository.profitAnalysis(clientId),
    ]);

  return {
    overview,
    financial_summary: financialSummary,
    projects,
    rfq_history: rfqHistory,
    boq_summary: boqSummary,
    po_summary: poSummary,
    billing_summary: billingSummary,
    payment_summary: paymentSummary,
    outstanding,
    cost_utilization: costUtilization,
    profit_analysis: profitAnalysis,
  };
}

/** GET /api/clients/:clientId/rfqs (doc §18) - proxies to the Commercial Lifecycle module's own RFQ list, filtered by client. */
async function getRfqs(clientId, user, reqQuery) {
  await assertClientExists(clientId, user);
  return rfqRepository.findAll({
    companyId: user.companyId,
    filters: { client_id: clientId, status: reqQuery.status },
    allowedSort: ['rfq_number', 'rfq_date', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

/** GET /api/clients/:clientId/projects (doc §18) - proxies to the external Project Management module's `projects` table. */
async function getProjects(clientId, user) {
  await assertClientExists(clientId, user);
  return clmClient360Repository.projects(clientId);
}

async function collectEntityIds(clientId, companyId) {
  const [contacts, requirements, invoices, payments] = await Promise.all([
    clmClientContactRepository.findByClientId(clientId),
    clmClientRequirementRepository.findAll({ companyId, filters: { client_id: clientId }, pagination: { limit: 200 } }),
    clmClientInvoiceRepository.findAll({ companyId, filters: { client_id: clientId }, pagination: { limit: 200 } }),
    clmPaymentRepository.findAll({ companyId, filters: { client_id: clientId }, pagination: { limit: 200 } }),
  ]);
  return {
    contactIds: contacts.map((c) => c.contact_id),
    requirementIds: requirements.rows.map((r) => r.requirement_id),
    invoiceIds: invoices.rows.map((i) => i.invoice_id),
    paymentIds: payments.rows.map((p) => p.payment_id),
  };
}

/** GET /api/clients/:clientId/documents (doc §18) - filters com_documents by every entity_type this client owns, per the polymorphic pattern in doc §16. */
async function getDocuments(clientId, user) {
  await assertClientExists(clientId, user);
  const entityIds = await collectEntityIds(clientId, user.companyId);
  return clmClient360Repository.documents(clientId, entityIds);
}

/** GET /api/clients/:clientId/activity (doc §18) - v_client_activity_history, scoped to this client's own entities plus its directly-linked RFQs. */
async function getActivity(clientId, user, reqQuery) {
  await assertClientExists(clientId, user);
  const entityIds = await collectEntityIds(clientId, user.companyId);
  const rfqs = await rfqRepository.findAll({ companyId: user.companyId, filters: { client_id: clientId }, pagination: { limit: 200 } });
  return clmClient360Repository.activityHistory(clientId, { ...entityIds, rfqIds: rfqs.rows.map((r) => r.rfq_id) }, reqQuery);
}

module.exports = { getOverview, getRfqs, getProjects, getDocuments, getActivity };
