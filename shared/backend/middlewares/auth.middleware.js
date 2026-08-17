'use strict';

const ApiError = require('../utils/apiError');
const { verifySupabaseToken } = require('../utils/jwt');

/**
 * Authenticates the request using the Supabase Auth access token.
 *
 * Per architecture Phase 12: `auth.users.id` (Supabase Auth) is the
 * canonical `users.id` referenced by every created_by/updated_by/
 * approver_id/changed_by column, and every com_* table is scoped by
 * company_id/branch_id (RLS-mirrored at the app layer here too, since the
 * service-role Postgres connection bypasses RLS by design - see database.js).
 *
 * Expects custom claims (company_id, branch_id, role, employee_id) to be
 * present in the token's `app_metadata` (or top-level, for flexibility) -
 * these are provisioned via a Supabase custom-access-token hook backed by
 * the `users`/`employees` master tables (external to this module).
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  let decoded;
  try {
    decoded = await verifySupabaseToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token', { details: err.message });
  }

  const claims = decoded.app_metadata || {};

  const userId = decoded.sub;
  const companyId = claims.company_id || decoded.company_id;
  const role = claims.role || decoded.user_role; // business role (Actors, Phase 1.2) - distinct from Supabase's own 'authenticated' role

  if (!userId) throw ApiError.unauthorized('Token missing subject claim');
  if (!companyId) throw ApiError.forbidden('Token missing company_id claim - user is not provisioned for any company');

  req.user = {
    id: userId,
    email: decoded.email || null,
    companyId,
    branchId: claims.branch_id || decoded.branch_id || null,
    role: role || null,
  };

  next();
}

module.exports = authenticate;
