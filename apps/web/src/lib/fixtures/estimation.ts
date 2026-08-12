import type { Estimation, EstimationItem } from "@/types/commercial/estimation";

/**
 * TEMPORARY FRONTEND FIXTURE — no Estimation backend endpoint exists yet.
 * Replace with real apiFetch("/estimation?rfqId=...") calls once the
 * Express com_estimation / com_estimation_items endpoints exist. Components
 * must go through the getters below, never read the arrays directly.
 *
 * Cost build-ups for RFQ-2026-0042 are seeded verbatim from the Phase 2/13
 * worked example in MODULE-1-COMMERCIAL-LIFECYCLE.md. Other RFQs extend the
 * same pattern with invented-but-consistent figures so the module reads as
 * a working pipeline across more than one record. RFQ-2026-0045 and
 * RFQ-2026-0051 intentionally have no estimation yet (received / draft
 * stage) to exercise empty states.
 */

const estimationFixtures: Estimation[] = [
  {
    id: "est-0042",
    rfqId: "rfq-2026-0042",
    estimationNumber: "EST-2026-0042",
    status: "approved",
    preparedBy: "usr-ramesh",
    preparedByName: "Ramesh Kumar",
    remarks: "Cost build-up approved after site engineer review.",
    createdAt: "2026-01-17T09:00:00.000Z",
    updatedAt: "2026-01-19T14:30:00.000Z",
  },
  {
    id: "est-0031",
    rfqId: "rfq-2026-0031",
    estimationNumber: "EST-2025-0031",
    status: "approved",
    preparedBy: "usr-ramesh",
    preparedByName: "Ramesh Kumar",
    remarks: null,
    createdAt: "2025-11-05T09:00:00.000Z",
    updatedAt: "2025-11-08T11:00:00.000Z",
  },
  {
    id: "est-0028",
    rfqId: "rfq-2026-0028",
    estimationNumber: "EST-2025-0028",
    status: "approved",
    preparedBy: "usr-priya",
    preparedByName: "Priya Nair",
    remarks: null,
    createdAt: "2025-09-23T09:00:00.000Z",
    updatedAt: "2025-09-25T10:00:00.000Z",
  },
  {
    id: "est-0038",
    rfqId: "rfq-2026-0038",
    estimationNumber: "EST-2025-0038",
    status: "approved",
    preparedBy: "usr-priya",
    preparedByName: "Priya Nair",
    remarks: null,
    createdAt: "2025-12-13T09:00:00.000Z",
    updatedAt: "2025-12-16T10:00:00.000Z",
  },
];

const estimationItemFixtures: EstimationItem[] = [
  // RFQ-2026-0042 — verbatim from Phase 2 worked example (2.1(a)), extended
  // to the other three priced items with consistent cost build-ups.
  {
    id: "esti-0042-21a",
    estimationId: "est-0042",
    rfqItemId: "ri-0042-2-1a",
    materialCost: 40,
    labourCost: 90,
    equipmentCost: 30,
    subcontractCost: 0,
    transportationCost: 10,
    otherDirectCost: 5,
    overheadCost: 5,
    contingencyCost: 0,
    estimatedUnitCost: 180,
    remarks: null,
  },
  {
    id: "esti-0042-21b",
    estimationId: "est-0042",
    rfqItemId: "ri-0042-2-1b",
    materialCost: 50,
    labourCost: 40,
    equipmentCost: 20,
    subcontractCost: 0,
    transportationCost: 10,
    otherDirectCost: 5,
    overheadCost: 5,
    contingencyCost: 0,
    estimatedUnitCost: 130,
    remarks: null,
  },
  {
    id: "esti-0042-22",
    estimationId: "est-0042",
    rfqItemId: "ri-0042-2-2",
    materialCost: 0,
    labourCost: 30,
    equipmentCost: 35,
    subcontractCost: 0,
    transportationCost: 12,
    otherDirectCost: 3,
    overheadCost: 2,
    contingencyCost: 0,
    estimatedUnitCost: 82,
    remarks: null,
  },
  {
    id: "esti-0042-31",
    estimationId: "est-0042",
    rfqItemId: "ri-0042-3-1",
    materialCost: 5500,
    labourCost: 900,
    equipmentCost: 700,
    subcontractCost: 0,
    transportationCost: 300,
    otherDirectCost: 100,
    overheadCost: 100,
    contingencyCost: 0,
    estimatedUnitCost: 7600,
    remarks: null,
  },

  // RFQ-2026-0031
  {
    id: "esti-0031-11",
    estimationId: "est-0031",
    rfqItemId: "ri-0031-1-1",
    materialCost: 60,
    labourCost: 70,
    equipmentCost: 20,
    subcontractCost: 0,
    transportationCost: 10,
    otherDirectCost: 0,
    overheadCost: 5,
    contingencyCost: 0,
    estimatedUnitCost: 165,
    remarks: null,
  },
  {
    id: "esti-0031-12",
    estimationId: "est-0031",
    rfqItemId: "ri-0031-1-2",
    materialCost: 2500,
    labourCost: 400,
    equipmentCost: 200,
    subcontractCost: 0,
    transportationCost: 50,
    otherDirectCost: 0,
    overheadCost: 50,
    contingencyCost: 0,
    estimatedUnitCost: 3200,
    remarks: null,
  },
  {
    id: "esti-0031-21",
    estimationId: "est-0031",
    rfqItemId: "ri-0031-2-1",
    materialCost: 5200,
    labourCost: 900,
    equipmentCost: 700,
    subcontractCost: 0,
    transportationCost: 250,
    otherDirectCost: 0,
    overheadCost: 150,
    contingencyCost: 0,
    estimatedUnitCost: 7200,
    remarks: null,
  },

  // RFQ-2026-0028
  {
    id: "esti-0028-11",
    estimationId: "est-0028",
    rfqItemId: "ri-0028-1-1",
    materialCost: 55,
    labourCost: 65,
    equipmentCost: 20,
    subcontractCost: 0,
    transportationCost: 15,
    otherDirectCost: 0,
    overheadCost: 5,
    contingencyCost: 0,
    estimatedUnitCost: 160,
    remarks: null,
  },
  {
    id: "esti-0028-12",
    estimationId: "est-0028",
    rfqItemId: "ri-0028-1-2",
    materialCost: 2400,
    labourCost: 350,
    equipmentCost: 200,
    subcontractCost: 0,
    transportationCost: 100,
    otherDirectCost: 0,
    overheadCost: 50,
    contingencyCost: 0,
    estimatedUnitCost: 3100,
    remarks: null,
  },

  // RFQ-2026-0038
  {
    id: "esti-0038-11",
    estimationId: "est-0038",
    rfqItemId: "ri-0038-1-1",
    materialCost: 55,
    labourCost: 65,
    equipmentCost: 20,
    subcontractCost: 0,
    transportationCost: 13,
    otherDirectCost: 0,
    overheadCost: 5,
    contingencyCost: 0,
    estimatedUnitCost: 158,
    remarks: null,
  },
  {
    id: "esti-0038-12",
    estimationId: "est-0038",
    rfqItemId: "ri-0038-1-2",
    materialCost: 2350,
    labourCost: 350,
    equipmentCost: 200,
    subcontractCost: 0,
    transportationCost: 100,
    otherDirectCost: 0,
    overheadCost: 50,
    contingencyCost: 0,
    estimatedUnitCost: 3050,
    remarks: null,
  },
  {
    id: "esti-0038-21",
    estimationId: "est-0038",
    rfqItemId: "ri-0038-2-1",
    materialCost: 5100,
    labourCost: 900,
    equipmentCost: 700,
    subcontractCost: 0,
    transportationCost: 250,
    otherDirectCost: 0,
    overheadCost: 150,
    contingencyCost: 0,
    estimatedUnitCost: 7100,
    remarks: null,
  },
  {
    id: "esti-0038-22",
    estimationId: "est-0038",
    rfqItemId: "ri-0038-2-2",
    materialCost: 45,
    labourCost: 40,
    equipmentCost: 20,
    subcontractCost: 0,
    transportationCost: 10,
    otherDirectCost: 0,
    overheadCost: 10,
    contingencyCost: 0,
    estimatedUnitCost: 125,
    remarks: null,
  },
];

export async function getEstimationByRfqId(rfqId: string): Promise<Estimation | null> {
  return estimationFixtures.find((e) => e.rfqId === rfqId) ?? null;
}

export async function getEstimationItems(estimationId: string): Promise<EstimationItem[]> {
  return estimationItemFixtures.filter((item) => item.estimationId === estimationId);
}

export async function getEstimationItemByRfqItemId(rfqItemId: string): Promise<EstimationItem | null> {
  return estimationItemFixtures.find((item) => item.rfqItemId === rfqItemId) ?? null;
}
