'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Generic password hashing helpers. Not on the Commercial module's hot
 * path (end-user auth is delegated to Supabase Auth), but kept available
 * for internal/service-account credentials that may live outside Supabase
 * Auth (e.g. a seeded system user).
 */
async function hash(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

async function compare(plainText, hashed) {
  return bcrypt.compare(plainText, hashed);
}

module.exports = { hash, compare };
