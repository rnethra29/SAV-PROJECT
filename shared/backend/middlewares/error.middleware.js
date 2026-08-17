'use strict';

const ApiError = require('../utils/apiError');
const logger = require('../config/logger');
const env = require('../config/env');

/** 404 fallback for unmatched routes - mount after all routers. */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Maps common Postgres error codes to sensible HTTP responses so raw SQL
 * constraint violations (from the DDL in src/database/migrations) surface
 * as clean API errors instead of 500s.
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
function mapPgError(err) {
  switch (err.code) {
    case '23505': // unique_violation
      return ApiError.conflict(`Duplicate value violates a unique constraint${err.constraint ? ` (${err.constraint})` : ''}`, {
        code: 'UNIQUE_VIOLATION',
      });
    case '23503': // foreign_key_violation
      return ApiError.badRequest(`Referenced record does not exist${err.constraint ? ` (${err.constraint})` : ''}`, {
        code: 'FOREIGN_KEY_VIOLATION',
      });
    case '23514': // check_violation
      return ApiError.badRequest(`Value violates a business rule constraint${err.constraint ? ` (${err.constraint})` : ''}`, {
        code: 'CHECK_VIOLATION',
      });
    case '23502': // not_null_violation
      return ApiError.badRequest(`Missing required field${err.column ? `: ${err.column}` : ''}`, {
        code: 'NOT_NULL_VIOLATION',
      });
    case '22P02': // invalid_text_representation (bad UUID / enum value)
      return ApiError.badRequest('Malformed identifier or enum value in request', { code: 'INVALID_INPUT_SYNTAX' });
    case '42501': // insufficient_privilege
      return ApiError.forbidden('Insufficient database privileges for this operation', { code: 'INSUFFICIENT_PRIVILEGE' });
    default:
      return null;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let apiError = err.isApiError ? err : null;

  if (!apiError && err.code) {
    apiError = mapPgError(err);
  }

  if (!apiError) {
    apiError = ApiError.internal(env.isProduction ? 'Internal server error' : err.message);
  }

  const level = apiError.statusCode >= 500 ? 'error' : 'warn';
  logger[level]('Request error', {
    method: req.method,
    url: req.originalUrl,
    statusCode: apiError.statusCode,
    message: apiError.message,
    code: apiError.code,
    stack: env.isProduction ? undefined : err.stack,
  });

  const body = {
    success: false,
    message: apiError.message,
    code: apiError.code || undefined,
    details: apiError.details || undefined,
  };

  if (!env.isProduction && apiError.statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(apiError.statusCode).json(body);
}

module.exports = { errorHandler, notFound };
