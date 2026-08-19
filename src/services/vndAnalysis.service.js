'use strict';

const vndAnalysisRepository = require('../repositories/vndAnalysis.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const vndVendorInvoiceRepository = require('../repositories/vndVendorInvoice.repository');
const clmProjectRepository = require('../repositories/clmProject.repository');
const ApiError = require('../utils/apiError');

async function vendorPerformance(vendorId, user) {
  const vendor = await vndVendorRepository.findById(vendorId, { companyId: user.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vndAnalysisRepository.vendorPerformance(vendorId) || { vendor_id: vendorId, total_pos: 0 };
}

async function vendorFinancialSummary(vendorId, user) {
  const vendor = await vndVendorRepository.findById(vendorId, { companyId: user.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vndAnalysisRepository.vendorFinancialSummary(vendorId);
}

async function vendorInvoiceSummary(vendorInvoiceId, user) {
  const invoice = await vndVendorInvoiceRepository.findById(vendorInvoiceId, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Vendor invoice not found');
  return vndAnalysisRepository.vendorInvoiceSummary(vendorInvoiceId);
}

async function projectCostSummary(projectId, user) {
  const project = await clmProjectRepository.findById(projectId, { companyId: user.companyId });
  if (!project) throw ApiError.notFound('Project not found');
  return vndAnalysisRepository.projectCostSummary(projectId);
}

async function projectFinancialSummary(projectId, user) {
  const project = await clmProjectRepository.findById(projectId, { companyId: user.companyId });
  if (!project) throw ApiError.notFound('Project not found');
  return vndAnalysisRepository.projectFinancialSummary(projectId);
}

async function projectFinancialSummaryList(user) {
  return vndAnalysisRepository.projectFinancialSummaryList({ companyId: user.companyId });
}

module.exports = { vendorPerformance, vendorFinancialSummary, vendorInvoiceSummary, projectCostSummary, projectFinancialSummary, projectFinancialSummaryList };
