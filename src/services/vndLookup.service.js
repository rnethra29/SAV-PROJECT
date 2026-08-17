'use strict';

const ApiError = require('../utils/apiError');
const { vendorTypeRepository, materialCategoryRepository } = require('../repositories/vndLookup.repository');

/** Thin pass-through service layer over the two Vendor Management Lookup repositories - mirrors src/services/clmLookup.service.js. */
function makeVndLookupService(repository, entityLabel) {
  return {
    async list(activeOnly) {
      return repository.findAll({ activeOnly });
    },
    async getById(id) {
      const row = await repository.findById(id);
      if (!row) throw ApiError.notFound(`${entityLabel} not found`);
      return row;
    },
    async create(data) {
      return repository.create(data);
    },
    async update(id, data) {
      const updated = await repository.update(id, data);
      if (!updated) throw ApiError.notFound(`${entityLabel} not found`);
      return updated;
    },
    async deactivate(id) {
      const updated = await repository.deactivate(id);
      if (!updated) throw ApiError.notFound(`${entityLabel} not found`);
      return updated;
    },
  };
}

module.exports = {
  makeVndLookupService,
  vendorTypeService: makeVndLookupService(vendorTypeRepository, 'Vendor type'),
  materialCategoryService: makeVndLookupService(materialCategoryRepository, 'Material category'),
};
