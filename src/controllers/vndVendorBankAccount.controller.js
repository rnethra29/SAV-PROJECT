'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const vndVendorBankAccountService = require('../services/vndVendorBankAccount.service');

const listByVendor = asyncHandler(async (req, res) => {
  const accounts = await vndVendorBankAccountService.listByVendor(req.params.vendorId, req.user);
  return success(res, { data: accounts });
});

const getById = asyncHandler(async (req, res) => {
  const account = await vndVendorBankAccountService.getById(req.params.id, req.user);
  return success(res, { data: account });
});

/** Separately-permissioned reveal endpoint (doc §20) - every call is written to com_audit_log with action='Download'. */
const reveal = asyncHandler(async (req, res) => {
  const account = await vndVendorBankAccountService.reveal(req.params.id, req.user);
  return success(res, { data: account });
});

const createUnderVendor = asyncHandler(async (req, res) => {
  const account = await vndVendorBankAccountService.create({ ...req.body, vendor_id: req.params.vendorId }, req.user);
  return created(res, account);
});

const update = asyncHandler(async (req, res) => {
  const account = await vndVendorBankAccountService.update(req.params.id, req.body, req.user);
  return success(res, { data: account, message: 'Vendor bank account updated' });
});

const verify = asyncHandler(async (req, res) => {
  const account = await vndVendorBankAccountService.verify(req.params.id, req.user);
  return success(res, { data: account, message: 'Vendor bank account verified' });
});

const remove = asyncHandler(async (req, res) => {
  const account = await vndVendorBankAccountService.remove(req.params.id, req.user);
  return success(res, { data: account, message: 'Vendor bank account deleted' });
});

module.exports = { listByVendor, getById, reveal, createUnderVendor, update, verify, remove };
