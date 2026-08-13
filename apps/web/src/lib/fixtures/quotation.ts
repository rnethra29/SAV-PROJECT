import type { Quotation, QuotationItem } from "@/types/commercial/quotation";

/**
 * TEMPORARY FRONTEND FIXTURE — no Quotation backend endpoint exists yet.
 * Replace with real apiFetch("/quotation?rfqId=...") calls once the Express
 * com_quotation / com_quotation_items endpoints exist. Quotations are
 * versioned/append-only (Phase 8, rule 5) — a revision is always a new
 * `com_quotation` row via `previousVersionId`, never an overwrite. Only
 * RFQ-2026-0042 currently has a second version, to demonstrate the pattern.
 */

const quotationFixtures: Quotation[] = [
  {
    id: "quo-0042-v1",
    rfqId: "rfq-2026-0042",
    projectId: "proj-suzlon-315",
    clientId: "cli-suzlon",
    quotationNumber: "QTN-2026-0042",
    versionNo: 1,
    previousVersionId: null,
    quotationDate: "2026-01-30",
    validityDate: "2026-03-01",
    status: "revised",
    paymentTerms: "30% advance, 60% on delivery, 10% on completion",
    executionPeriod: "90 days from PO",
    inclusions: "All labour, material, equipment and tools as per BOQ.",
    exclusions: "GST extra as applicable. Dewatering beyond normal seepage excluded.",
    commercialTerms: "Rates firm for validity period. Escalation as per mutually agreed clause.",
    subtotalAmount: 1895440,
    taxAmount: 0,
    totalAmount: 1895440,
    remarks: "Superseded by v2 after negotiation settled on revised rates.",
    createdAt: "2026-01-30T10:00:00.000Z",
    updatedAt: "2026-02-10T16:00:00.000Z",
  },
  {
    id: "quo-0042-v2",
    rfqId: "rfq-2026-0042",
    projectId: "proj-suzlon-315",
    clientId: "cli-suzlon",
    quotationNumber: "QTN-2026-0042",
    versionNo: 2,
    previousVersionId: "quo-0042-v1",
    quotationDate: "2026-02-10",
    validityDate: "2026-03-15",
    status: "accepted",
    paymentTerms: "30% advance, 60% on delivery, 10% on completion",
    executionPeriod: "90 days from PO",
    inclusions: "All labour, material, equipment and tools as per BOQ.",
    exclusions: "GST extra as applicable. Dewatering beyond normal seepage excluded.",
    commercialTerms: "Final negotiated rates — firm for validity period.",
    subtotalAmount: 1826280,
    taxAmount: 0,
    totalAmount: 1826280,
    remarks: "Reflects final agreed rates from negotiation.",
    createdAt: "2026-02-10T16:05:00.000Z",
    updatedAt: "2026-02-11T09:00:00.000Z",
  },
  {
    id: "quo-0031-v1",
    rfqId: "rfq-2026-0031",
    projectId: "proj-ogp-substation",
    clientId: "cli-orient-green",
    quotationNumber: "QTN-2025-0031",
    versionNo: 1,
    previousVersionId: null,
    quotationDate: "2025-11-10",
    validityDate: "2025-12-15",
    status: "accepted",
    paymentTerms: "As per PO terms",
    executionPeriod: "120 days",
    inclusions: "All labour, material, equipment and tools as per BOQ.",
    exclusions: "GST extra as applicable.",
    commercialTerms: "Rates firm for validity period.",
    subtotalAmount: 914200,
    taxAmount: 0,
    totalAmount: 914200,
    remarks: null,
    createdAt: "2025-11-10T10:00:00.000Z",
    updatedAt: "2026-01-05T16:40:00.000Z",
  },
  {
    id: "quo-0028-v1",
    rfqId: "rfq-2026-0028",
    projectId: "proj-inox-2mw",
    clientId: "cli-inox-wind",
    quotationNumber: "QTN-2025-0028",
    versionNo: 1,
    previousVersionId: null,
    quotationDate: "2025-09-26",
    validityDate: "2025-10-31",
    status: "rejected",
    paymentTerms: "20% advance, 70% on delivery, 10% on completion",
    executionPeriod: "75 days from PO",
    inclusions: "All labour, material, equipment and tools as per BOQ.",
    exclusions: "GST extra as applicable.",
    commercialTerms: "Rates firm for validity period.",
    subtotalAmount: 218600,
    taxAmount: 0,
    totalAmount: 218600,
    remarks: "Lost to competitor on pricing — client did not counter beyond initial offer.",
    createdAt: "2025-09-26T10:00:00.000Z",
    updatedAt: "2025-10-18T13:20:00.000Z",
  },
  {
    id: "quo-0038-v1",
    rfqId: "rfq-2026-0038",
    projectId: "proj-inox-2mw",
    clientId: "cli-inox-wind",
    quotationNumber: "QTN-2025-0038",
    versionNo: 1,
    previousVersionId: null,
    quotationDate: "2025-12-18",
    validityDate: "2026-02-15",
    status: "submitted",
    paymentTerms: "25% advance, 65% on delivery, 10% on completion",
    executionPeriod: "100 days from PO",
    inclusions: "All labour, material, equipment and tools as per BOQ.",
    exclusions: "GST extra as applicable.",
    commercialTerms: "Rates firm for validity period.",
    subtotalAmount: 1787490,
    taxAmount: 0,
    totalAmount: 1787490,
    remarks: "Under active negotiation with client.",
    createdAt: "2025-12-18T10:00:00.000Z",
    updatedAt: "2026-01-28T15:10:00.000Z",
  },
];

const quotationItemFixtures: QuotationItem[] = [
  // RFQ-2026-0042 v1 — original quoted rates
  { id: "qi-0042-21a-v1", quotationId: "quo-0042-v1", rfqItemId: "ri-0042-2-1a", estimationItemId: "esti-0042-21a", itemCode: "2.1(a)", quantity: 500, unit: "m3", quotedRate: 210, quotedAmount: 105000, taxPercentage: 0, remarks: null },
  { id: "qi-0042-21b-v1", quotationId: "quo-0042-v1", rfqItemId: "ri-0042-2-1b", estimationItemId: "esti-0042-21b", itemCode: "2.1(b)", quantity: 120, unit: "m3", quotedRate: 155, quotedAmount: 18600, taxPercentage: 0, remarks: null },
  { id: "qi-0042-22-v1", quotationId: "quo-0042-v1", rfqItemId: "ri-0042-2-2", estimationItemId: "esti-0042-22", itemCode: "2.2", quantity: 80, unit: "m3", quotedRate: 98, quotedAmount: 7840, taxPercentage: 0, remarks: null },
  { id: "qi-0042-31-v1", quotationId: "quo-0042-v1", rfqItemId: "ri-0042-3-1", estimationItemId: "esti-0042-31", itemCode: "3.1", quantity: 210, unit: "m3", quotedRate: 8400, quotedAmount: 1764000, taxPercentage: 0, remarks: null },

  // RFQ-2026-0042 v2 — final negotiated rates
  { id: "qi-0042-21a-v2", quotationId: "quo-0042-v2", rfqItemId: "ri-0042-2-1a", estimationItemId: "esti-0042-21a", itemCode: "2.1(a)", quantity: 500, unit: "m3", quotedRate: 202, quotedAmount: 101000, taxPercentage: 0, remarks: null },
  { id: "qi-0042-21b-v2", quotationId: "quo-0042-v2", rfqItemId: "ri-0042-2-1b", estimationItemId: "esti-0042-21b", itemCode: "2.1(b)", quantity: 120, unit: "m3", quotedRate: 148, quotedAmount: 17760, taxPercentage: 0, remarks: null },
  { id: "qi-0042-22-v2", quotationId: "quo-0042-v2", rfqItemId: "ri-0042-2-2", estimationItemId: "esti-0042-22", itemCode: "2.2", quantity: 80, unit: "m3", quotedRate: 94, quotedAmount: 7520, taxPercentage: 0, remarks: null },
  { id: "qi-0042-31-v2", quotationId: "quo-0042-v2", rfqItemId: "ri-0042-3-1", estimationItemId: "esti-0042-31", itemCode: "3.1", quantity: 210, unit: "m3", quotedRate: 8100, quotedAmount: 1701000, taxPercentage: 0, remarks: null },

  // RFQ-2026-0031
  { id: "qi-0031-11-v1", quotationId: "quo-0031-v1", rfqItemId: "ri-0031-1-1", estimationItemId: "esti-0031-11", itemCode: "1.1", quantity: 340, unit: "m3", quotedRate: 185, quotedAmount: 62900, taxPercentage: 0, remarks: null },
  { id: "qi-0031-12-v1", quotationId: "quo-0031-v1", rfqItemId: "ri-0031-1-2", estimationItemId: "esti-0031-12", itemCode: "1.2", quantity: 28, unit: "m3", quotedRate: 3600, quotedAmount: 100800, taxPercentage: 0, remarks: null },
  { id: "qi-0031-21-v1", quotationId: "quo-0031-v1", rfqItemId: "ri-0031-2-1", estimationItemId: "esti-0031-21", itemCode: "2.1", quantity: 95, unit: "m3", quotedRate: 7900, quotedAmount: 750500, taxPercentage: 0, remarks: null },

  // RFQ-2026-0028
  { id: "qi-0028-11-v1", quotationId: "quo-0028-v1", rfqItemId: "ri-0028-1-1", estimationItemId: "esti-0028-11", itemCode: "1.1", quantity: 610, unit: "m3", quotedRate: 180, quotedAmount: 109800, taxPercentage: 0, remarks: null },
  { id: "qi-0028-12-v1", quotationId: "quo-0028-v1", rfqItemId: "ri-0028-1-2", estimationItemId: "esti-0028-12", itemCode: "1.2", quantity: 32, unit: "m3", quotedRate: 3400, quotedAmount: 108800, taxPercentage: 0, remarks: null },

  // RFQ-2026-0038
  { id: "qi-0038-11-v1", quotationId: "quo-0038-v1", rfqItemId: "ri-0038-1-1", estimationItemId: "esti-0038-11", itemCode: "1.1", quantity: 480, unit: "m3", quotedRate: 178, quotedAmount: 85440, taxPercentage: 0, remarks: null },
  { id: "qi-0038-12-v1", quotationId: "quo-0038-v1", rfqItemId: "ri-0038-1-2", estimationItemId: "esti-0038-12", itemCode: "1.2", quantity: 26, unit: "m3", quotedRate: 3350, quotedAmount: 87100, taxPercentage: 0, remarks: null },
  { id: "qi-0038-21-v1", quotationId: "quo-0038-v1", rfqItemId: "ri-0038-2-1", estimationItemId: "esti-0038-21", itemCode: "2.1", quantity: 205, unit: "m3", quotedRate: 7800, quotedAmount: 1599000, taxPercentage: 0, remarks: null },
  { id: "qi-0038-22-v1", quotationId: "quo-0038-v1", rfqItemId: "ri-0038-2-2", estimationItemId: "esti-0038-22", itemCode: "2.2", quantity: 110, unit: "m3", quotedRate: 145, quotedAmount: 15950, taxPercentage: 0, remarks: null },
];

export async function getQuotationVersions(rfqId: string): Promise<Quotation[]> {
  return quotationFixtures.filter((q) => q.rfqId === rfqId).sort((a, b) => a.versionNo - b.versionNo);
}

export async function getCurrentQuotation(rfqId: string): Promise<Quotation | null> {
  const versions = await getQuotationVersions(rfqId);
  if (versions.length === 0) return null;
  return versions[versions.length - 1];
}

export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
  return quotationFixtures.find((q) => q.id === quotationId) ?? null;
}

export async function getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  return quotationItemFixtures.filter((item) => item.quotationId === quotationId);
}

export async function getQuotationItemsByRfqItemId(rfqItemId: string): Promise<QuotationItem[]> {
  return quotationItemFixtures.filter((item) => item.rfqItemId === rfqItemId);
}
