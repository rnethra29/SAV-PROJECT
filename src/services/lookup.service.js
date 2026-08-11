'use strict';

const ApiError = require('../utils/apiError');
const { itemCategoryRepository, priceSourceTypeRepository, documentCategoryRepository } = require('../repositories/lookup.repository');

/**
 * Thin pass-through service layer over the three Lookup repositories - kept
 * for symmetry with every other module (controllers never talk to
 * repositories directly) and as the natural place to add cross-cutting
 * rules later (e.g. "category cannot be deactivated while in use").
 */
function makeLookupService(repository, entityLabel) {
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
  itemCategoryService: makeLookupService(itemCategoryRepository, 'Item category'),
  priceSourceTypeService: makeLookupService(priceSourceTypeRepository, 'Price source type'),
  documentCategoryService: makeLookupService(documentCategoryRepository, 'Document category'),
};
