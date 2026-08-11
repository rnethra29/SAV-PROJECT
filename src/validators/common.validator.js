'use strict';

const Joi = require('joi');

const uuid = Joi.string().uuid({ version: 'uuidv4' });

const idParam = (name) => Joi.object({ [name]: uuid.required() });

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  sortBy: Joi.string().optional(),
  sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
}).unknown(true);

module.exports = { uuid, idParam, paginationQuery };
