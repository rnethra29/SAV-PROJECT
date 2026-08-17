'use strict';

const asyncHandler = require('../../../../shared/backend/utils/asyncHandler');
const { success, paginated } = require('../../../../shared/backend/utils/response');
const clmClient360Service = require('../services/clmClient360.service');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await clmClient360Service.getOverview(req.params.clientId, req.user);
  return success(res, { data: overview });
});

const getRfqs = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClient360Service.getRfqs(req.params.clientId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await clmClient360Service.getProjects(req.params.clientId, req.user);
  return success(res, { data: projects });
});

const getDocuments = asyncHandler(async (req, res) => {
  const documents = await clmClient360Service.getDocuments(req.params.clientId, req.user);
  return success(res, { data: documents });
});

const getActivity = asyncHandler(async (req, res) => {
  const { rows, page, limit, total } = await clmClient360Service.getActivity(req.params.clientId, req.user, req.query);
  return paginated(res, rows, { page, limit, total });
});

module.exports = { getOverview, getRfqs, getProjects, getDocuments, getActivity };
