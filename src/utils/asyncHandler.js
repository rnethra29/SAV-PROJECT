'use strict';

/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * next(err) instead of crashing the process / hanging the request.
 * (Belt-and-braces alongside `express-async-errors`, which is also loaded.)
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
