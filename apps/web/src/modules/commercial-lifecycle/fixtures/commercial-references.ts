/**
 * TEMPORARY FRONTEND FIXTURE — client/project/site are existing SAV master
 * tables per MODULE-1-COMMERCIAL-LIFECYCLE.md (§1.6): referenced by FK only,
 * never owned by the Commercial module. Until the real client/project/site
 * master-data endpoints exist, the RFQ creation form reads these isolated
 * fixtures instead. Replace with real apiFetch("/clients"), ("/projects"),
 * ("/sites") calls once those modules/endpoints exist — do not let RFQ
 * components read fixture arrays directly, always go through the getters
 * below.
 */

export type ClientOption = {
  id: string;
  name: string;
};

export type ProjectOption = {
  id: string;
  clientId: string;
  name: string;
};

export type SiteOption = {
  id: string;
  projectId: string;
  name: string;
};

export type VendorOption = {
  id: string;
  name: string;
};

const clientFixtures: ClientOption[] = [
  { id: "cli-suzlon", name: "Suzlon Energy Ltd." },
  { id: "cli-orient-green", name: "Orient Green Power Company Ltd." },
  { id: "cli-inox-wind", name: "Inox Wind Ltd." },
];

const projectFixtures: ProjectOption[] = [
  { id: "proj-suzlon-315", clientId: "cli-suzlon", name: "SUZLON 3.15MW Foundation" },
  { id: "proj-ogp-substation", clientId: "cli-orient-green", name: "OGP 33kV Substation Works" },
  { id: "proj-inox-2mw", clientId: "cli-inox-wind", name: "INOX 2MW Foundation Package" },
];

const siteFixtures: SiteOption[] = [
  { id: "site-suzlon-a", projectId: "proj-suzlon-315", name: "Site A — Kutch, Gujarat" },
  { id: "site-ogp-1", projectId: "proj-ogp-substation", name: "Site 1 — Tirunelveli, TN" },
];

export async function getClientOptions(): Promise<ClientOption[]> {
  return clientFixtures;
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  return projectFixtures;
}

const vendorFixtures: VendorOption[] = [
  { id: "vnd-shree-earthmovers", name: "Shree Earthmovers & Co." },
  { id: "vnd-omsai-concrete", name: "Om Sai Concrete Suppliers" },
  { id: "vnd-ganesh-structural", name: "Ganesh Structural Contractors" },
];

export async function getSiteOptions(): Promise<SiteOption[]> {
  return siteFixtures;
}

export async function getVendorOptions(): Promise<VendorOption[]> {
  return vendorFixtures;
}
