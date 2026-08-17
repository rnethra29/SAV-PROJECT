'use strict';

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

/**
 * Server-side Supabase client, created with the secret key (new-format
 * `sb_secret_...`, or the legacy `service_role` JWT - see env.js). Used ONLY
 * in trusted backend contexts (per architecture Phase 12 "Security" note):
 * Storage operations (private bucket uploads, signed URL generation) and,
 * where needed, administrative Auth lookups. Never expose this client or
 * its key to the frontend.
 */
const supabaseAdmin = createClient(env.supabase.url, env.supabase.secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabaseAdmin };
