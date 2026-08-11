'use strict';

const jwt = require('jsonwebtoken');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const env = require('../config/env');

/**
 * Verifies a Supabase Auth access token.
 *
 * Newer Supabase projects sign tokens asymmetrically (e.g. ES256) and
 * publish their public keys at a JWKS endpoint (`SUPABASE_JWKS_URL`) rather
 * than handing out a shared HS256 secret - this is the primary path.
 * `jose`'s `createRemoteJWKSet` fetches and caches the key set (and
 * transparently re-fetches on a `kid` it hasn't seen, e.g. after key
 * rotation), so we build it once per process rather than per request.
 *
 * Older projects (or ones still on legacy JWT settings) fall back to a
 * static HS256 `SUPABASE_JWT_SECRET` verified via `jsonwebtoken`.
 *
 * Either way this resolves to a plain object of JWT claims (`sub`,
 * `app_metadata`, `email`, ...), matching what auth.middleware.js expects.
 */
let remoteJwks = null;
function getRemoteJwks() {
  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(env.supabase.jwksUrl));
  }
  return remoteJwks;
}

async function verifySupabaseToken(token) {
  if (env.supabase.jwksUrl) {
    const { payload } = await jwtVerify(token, getRemoteJwks(), {
      issuer: `${env.supabase.url}/auth/v1`,
    });
    return payload;
  }

  // Legacy fallback: shared HS256 secret.
  return jwt.verify(token, env.supabase.jwtSecret, { algorithms: ['HS256'] });
}

/**
 * Sign/verify helpers for optional app-issued service tokens (e.g. internal
 * scripts, cron jobs) - independent of Supabase Auth. Only usable when
 * JWT_SECRET is configured.
 */
function signServiceToken(payload) {
  if (!env.jwt.secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function verifyServiceToken(token) {
  if (!env.jwt.secret) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { verifySupabaseToken, signServiceToken, verifyServiceToken };
