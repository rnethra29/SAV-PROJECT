import { apiFetch } from "@/lib/api-client";
import type { ClmProjectLookup } from "@/types/sites/project";

type ClmProjectListResponse = {
  success: boolean;
  message: string;
  data: ClmProjectLookup[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/**
 * GET /projects — src/routes/clmProject.routes.js:30, mounted at
 * src/routes/index.js:102. Full clm_project rows come back, but only the
 * id/code/name this module's Project dropdown needs are modeled
 * (ClmProjectLookup) — Project Management itself is a separate,
 * not-yet-built frontend area.
 */
export async function getProjectOptions(): Promise<ClmProjectLookup[]> {
  const response = await apiFetch<ClmProjectListResponse>("/projects");
  return response.data;
}
