'use strict';

/**
 * Standard success envelope used by every controller in this module.
 */
function success(res, { data = null, message = 'OK', statusCode = 200, meta = undefined } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function created(res, data, message = 'Created') {
  return success(res, { data, message, statusCode: 201 });
}

function noContent(res) {
  return res.status(204).send();
}

/**
 * Standard paginated list envelope.
 * @param {import('express').Response} res
 * @param {any[]} rows
 * @param {{ page: number, limit: number, total: number }} pagination
 */
function paginated(res, rows, pagination, message = 'OK') {
  const { page, limit, total } = pagination;
  return success(res, {
    data: rows,
    message,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  });
}

module.exports = { success, created, noContent, paginated };
