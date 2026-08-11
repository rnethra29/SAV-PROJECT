'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const approvalService = require('../services/approval.service');

const listByEntity = asyncHandler(async (req, res) => {
  const approvals = await approvalService.listByEntity(req.params.entityType, req.params.entityId);
  return success(res, { data: approvals });
});

const requestApproval = asyncHandler(async (req, res) => {
  const approval = await approvalService.requestApproval(req.body, req.user);
  return created(res, approval, 'Approval requested');
});

const approve = asyncHandler(async (req, res) => {
  const approval = await approvalService.decide(req.params.id, { status: 'Approved', comments: req.body.comments }, req.user);
  return success(res, { data: approval, message: 'Approved' });
});

const reject = asyncHandler(async (req, res) => {
  const approval = await approvalService.decide(
    req.params.id,
    { status: 'Rejected', comments: req.body.comments, rejectionReason: req.body.rejectionReason },
    req.user
  );
  return success(res, { data: approval, message: 'Rejected' });
});

module.exports = { listByEntity, requestApproval, approve, reject };
