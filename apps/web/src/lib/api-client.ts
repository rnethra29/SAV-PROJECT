/**
 * Thin fetch wrapper for calling the Express API.
 *
 * Per SAV-ERP-PROJECT-CONTEXT.md (B.4): the frontend never performs direct
 * business-data database operations. Every business-critical request goes
 * Next.js -> Express API -> Auth/RBAC -> Prisma -> PostgreSQL. This client
 * is the only sanctioned path from the frontend to business data.
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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
