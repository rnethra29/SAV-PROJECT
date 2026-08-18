/**
 * Thin fetch wrapper for calling the Express API.
 *
 * Per SAV-ERP-PROJECT-CONTEXT.md (B.4): the frontend never performs direct
 * business-data database operations. Every business-critical request goes
 * Next.js -> Express API -> Auth/RBAC -> Postgres. This client is the only
 * sanctioned path from the frontend to business data.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Attaches the current Supabase session's access token, browser-side only
 * (architecture: session -> JWT -> apiFetch -> `Authorization: Bearer
 * <JWT>` -> src/middlewares/auth.middleware.js). Server Components have no
 * browser session to read in this architecture (no cookie-bridged session —
 * see src/lib/supabase/client.ts), so on the server this is a no-op and the
 * request goes out unauthenticated, same as before. Dynamic import keeps
 * @supabase/supabase-js out of any server-only call path that never needs
 * it, and reading getSession() fresh on every call (rather than caching)
 * means a just-refreshed or just-cleared token is never sent stale.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { getSupabaseClient } = await import("./supabase/client");
    const {
      data: { session },
    } = await getSupabaseClient().auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const authHeader = await getAuthHeader();

  // FormData bodies (multipart file uploads) must NOT get a manual
  // Content-Type: the browser sets one itself with the multipart boundary
  // — overriding it here breaks the upload silently on the server side.
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeader,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ApiError(response.status, body || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
