'use strict';

/**
 * Typed application error carrying an HTTP status code and an optional
 * machine-readable `code` + `details` payload. Thrown anywhere in the
 * service/controller layer and caught centrally by error.middleware.js.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {{ code?: string, details?: any }} [opts]
   */
  constructor(statusCode, message, opts = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = opts.code || null;
    this.details = opts.details || null;
    this.isApiError = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, opts) {
    return new ApiError(400, message, opts);
  }

  static unauthorized(message = 'Unauthorized', opts) {
    return new ApiError(401, message, opts);
  }

  static forbidden(message = 'Forbidden', opts) {
    return new ApiError(403, message, opts);
  }

  static notFound(message = 'Resource not found', opts) {
    return new ApiError(404, message, opts);
  }

  static conflict(message = 'Conflict', opts) {
    return new ApiError(409, message, opts);
  }

  static unprocessable(message = 'Unprocessable entity', opts) {
    return new ApiError(422, message, opts);
  }

  static internal(message = 'Internal server error', opts) {
    return new ApiError(500, message, opts);
  }
}

module.exports = ApiError;
