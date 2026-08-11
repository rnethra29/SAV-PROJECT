'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { paginated } = require('../utils/response');
const auditService = require('../services/audit.service');

const getHistory = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { rows, page, limit, total } = await auditService.history(entityType, entityId, req.query);
  return paginated(res, rows, { page, limit, total });
});

module.exports = { getHistory };
