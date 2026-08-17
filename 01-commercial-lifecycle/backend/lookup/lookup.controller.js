'use strict';

const asyncHandler = require('../../../shared/backend/utils/asyncHandler');
const { success, created } = require('../../../shared/backend/utils/response');
const { itemCategoryService, priceSourceTypeService, documentCategoryService } = require('./lookup.service');

function makeLookupController(service) {
  return {
    list: asyncHandler(async (req, res) => {
      const activeOnly = req.query.activeOnly !== 'false';
      const rows = await service.list(activeOnly);
      return success(res, { data: rows });
    }),
    getById: asyncHandler(async (req, res) => {
      const row = await service.getById(req.params.id);
      return success(res, { data: row });
    }),
    create: asyncHandler(async (req, res) => {
      const row = await service.create(req.body);
      return created(res, row);
    }),
    update: asyncHandler(async (req, res) => {
      const row = await service.update(req.params.id, req.body);
      return success(res, { data: row, message: 'Updated' });
    }),
    deactivate: asyncHandler(async (req, res) => {
      const row = await service.deactivate(req.params.id);
      return success(res, { data: row, message: 'Deactivated' });
    }),
  };
}

module.exports = {
  itemCategoryController: makeLookupController(itemCategoryService),
  priceSourceTypeController: makeLookupController(priceSourceTypeService),
  documentCategoryController: makeLookupController(documentCategoryService),
};
