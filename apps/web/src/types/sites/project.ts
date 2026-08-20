/**
 * Minimal clm_project lookup, per architecture doc §6.1 and
 * src/validators/clmProject.validator.js. Only the fields the Procurement
 * Order form's Project dropdown needs — Project Management itself (full
 * list/detail/create) is a separate, not-yet-built frontend area outside
 * Vendor/Procurement scope. Do not add more fields here without a screen
 * that actually needs them.
 */
export type ClmProjectLookup = {
  project_id: string;
  project_code: string;
  project_name: string;
};
