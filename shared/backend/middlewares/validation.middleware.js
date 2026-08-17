'use strict';

const ApiError = require('../utils/apiError');

/**
 * Generic Joi-schema validation middleware factory.
 * `validate(schema)` validates req.body (default).
 * `validate(schema, 'query')` / `validate(schema, 'params')` validate those instead.
 *
 * On success, req[source] is replaced with the coerced/defaulted value so
 * downstream code can trust types (e.g. numeric strings -> numbers).
 */
function validate(schema, source = 'body') {
  return function validateMiddleware(req, res, next) {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      throw ApiError.badRequest('Validation failed', {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      });
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
