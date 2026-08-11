'use strict';

const ApiError = require('../utils/apiError');
const { ROLES } = require('../models/enums');

/**
 * Role-gate factory. `requireRole('Admin', ROLES.APPROVER)(req, res, next)`
 * Actors are per architecture Phase 1.2. Admin is always allowed through,
 * mirroring standard SAV ERP convention (admin is a superset role).
 * @param {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return function roleGate(req, res, next) {
    if (!req.user) throw ApiError.unauthorized('Authentication required before role check');
    if (req.user.role === ROLES.ADMIN) return next();
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
    }
    return next();
  };
}

module.exports = requireRole;
