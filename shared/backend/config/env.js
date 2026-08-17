'use strict';

require('dotenv').config();
const Joi = require('joi');

/**
 * Validates and exposes all environment configuration used by the
 * Commercial Lifecycle module backend. Fail fast on boot if anything
 * required is missing/malformed rather than surfacing cryptic errors later.
 *
 * Supabase key naming: projects created after the 2025 API-key rotation use
 * `sb_publishable_...` / `sb_secret_...` keys and a JWKS URL (asymmetric
 * signing, e.g. ES256) instead of the legacy `anon`/`service_role` JWTs and
 * shared HS256 JWT secret. Both naming schemes are accepted below so this
 * still works against an older project; at least one secret-key variant and
 * at least one JWT-verification variant (JWKS URL or legacy secret) must be
 * present.
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('/api/v1'),

  // Supabase (Postgres) direct/pooled connection - used for transactional SQL, views, recursive CTEs
  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_SSL: Joi.boolean().default(true),
  DATABASE_POOL_MAX: Joi.number().default(10),

  // Supabase project - used for Storage (documents) and Auth JWT verification
  SUPABASE_URL: Joi.string().uri().required(),

  // Server-side key (Storage admin, bypasses RLS) - new vs legacy naming
  SUPABASE_SECRET_KEY: Joi.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),

  // Client-safe key (not currently used server-side, kept for reference/parity)
  SUPABASE_PUBLISHABLE_KEY: Joi.string().allow('').optional(),
  SUPABASE_ANON_KEY: Joi.string().allow('').optional(),

  // Auth token verification - new (JWKS, asymmetric) vs legacy (shared HS256 secret)
  SUPABASE_JWKS_URL: Joi.string().uri().optional(),
  SUPABASE_JWT_SECRET: Joi.string().optional(),

  // Document storage
  DOCUMENTS_BUCKET: Joi.string().default('com-documents'),
  SIGNED_URL_EXPIRY_SECONDS: Joi.number().default(300),

  // App-issued JWT (service-to-service / non-Supabase-Auth flows), optional
  JWT_SECRET: Joi.string().allow('').optional(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  CORS_ORIGIN: Joi.string().default('*'),
  LOG_LEVEL: Joi.string().default('info'),
})
  .unknown(true);

const { value: env, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  // eslint-disable-next-line no-console
  console.error('[env] Invalid/missing environment configuration:\n' + error.details.map((d) => ` - ${d.message}`).join('\n'));
  process.exit(1);
}

const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '';
const jwksUrl = env.SUPABASE_JWKS_URL || null;
const jwtSecret = env.SUPABASE_JWT_SECRET || null;

const configErrors = [];
if (!secretKey) configErrors.push('Set SUPABASE_SECRET_KEY (new-format server-side key) or SUPABASE_SERVICE_ROLE_KEY (legacy).');
if (!jwksUrl && !jwtSecret) configErrors.push('Set SUPABASE_JWKS_URL (new asymmetric-signing projects) or SUPABASE_JWT_SECRET (legacy shared HS256 secret) to verify Auth tokens.');

if (configErrors.length) {
  // eslint-disable-next-line no-console
  console.error('[env] Invalid/missing environment configuration:\n' + configErrors.map((m) => ` - ${m}`).join('\n'));
  process.exit(1);
}

module.exports = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  apiPrefix: env.API_PREFIX,

  database: {
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    poolMax: env.DATABASE_POOL_MAX,
  },

  supabase: {
    url: env.SUPABASE_URL,
    secretKey,
    publishableKey,
    jwksUrl,
    jwtSecret,
  },

  documents: {
    bucket: env.DOCUMENTS_BUCKET,
    signedUrlExpirySeconds: env.SIGNED_URL_EXPIRY_SECONDS,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  logLevel: env.LOG_LEVEL,
};
