/**
 * Single switch for "no backend yet — render the real frontend against an
 * in-memory development fixture store instead of the real API." Double-
 * gated on purpose, same reasoning as RequireAuth's dev bypass
 * (apps/web/src/components/layout/RequireAuth.tsx): Next.js hard-sets
 * NODE_ENV to "production" for `next build`/`next start` regardless of env
 * vars, so DEV_FIXTURE_MODE can never be true in a real build — the
 * NEXT_PUBLIC_DEV_BYPASS_AUTH flag (apps/web/.env.local, gitignored, never
 * committed) is a second, explicit opt-in so `next dev` alone doesn't
 * silently swap in fixture data for everyone. Reuses the same flag as the
 * auth bypass rather than introducing a second one: in this project's
 * current phase ("frontend-only, no backend yet"), "skip login" and "skip
 * the API" are the same underlying situation.
 */
export const DEV_FIXTURE_MODE =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
