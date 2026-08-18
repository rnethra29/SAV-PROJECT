import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// New-format `sb_publishable_...` key (preferred) vs legacy `anon` JWT —
// same new-vs-legacy split as the backend's SUPABASE_PUBLISHABLE_KEY /
// SUPABASE_ANON_KEY (src/config/env.js).
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client — Supabase Auth is the sole identity provider
 * (src/middlewares/auth.middleware.js verifies its JWTs directly, no
 * separate issuer). Uses Supabase's own default session handling
 * (persisted + auto-refreshed by the SDK) rather than any custom token
 * storage. Public-safe anon/publishable key only — the secret key
 * (src/config/supabase.js) is server-only and never reaches the browser.
 *
 * Throws (not silently falls back) when unconfigured, so callers can
 * distinguish "not configured" from "no session" instead of both looking
 * unauthenticated the same way.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in apps/web/.env.local",
    );
  }

  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
