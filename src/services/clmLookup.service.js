'use strict';

const ApiError = require('../utils/apiError');
const { clientTypeRepository, industryRepository, contactTypeRepository } = require('../repositories/clmLookup.repository');

/** Thin pass-through service layer over the three Client Management Lookup repositories - mirrors src/services/lookup.service.js's makeLookupService shape. */
function makeClmLookupService(repository, entityLabel) {
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
  makeClmLookupService,
  clientTypeService: makeClmLookupService(clientTypeRepository, 'Client type'),
  industryService: makeClmLookupService(industryRepository, 'Industry'),
  contactTypeService: makeClmLookupService(contactTypeRepository, 'Contact type'),
};
