'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const ApiError = require('../utils/apiError');
const documentService = require('../services/document.service');

const listByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId, activeOnly } = req.query;
  const docs = await documentService.listByEntity(entityType, entityId, req.user, { activeOnly });
  return success(res, { data: docs });
});

const getById = asyncHandler(async (req, res) => {
  const doc = await documentService.getById(req.params.id, req.user);
  return success(res, { data: doc });
});

const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('file is required (multipart/form-data field name: "file")');
  const doc = await documentService.upload({ ...req.body, file: req.file }, req.user);
  return created(res, doc, 'Document uploaded');
});

const getSignedUrl = asyncHandler(async (req, res) => {
  const result = await documentService.getSignedUrl(req.params.id, req.user);
  return success(res, { data: result });
});

const archive = asyncHandler(async (req, res) => {
  const doc = await documentService.archive(req.params.id, req.user);
  return success(res, { data: doc, message: 'Document archived' });
});

module.exports = { listByEntity, getById, upload, getSignedUrl, archive };
