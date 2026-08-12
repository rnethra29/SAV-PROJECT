export type EstimationStatus =
  | "draft"
  | "in_progress"
  | "submitted_for_approval"
  | "approved"
  | "rejected"
  | "revised";

export type Estimation = {
  id: string;
  rfqId: string;
  estimationNumber: string;
  status: EstimationStatus;
  preparedBy: string;
  preparedByName: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EstimationItem = {
  id: string;
  estimationId: string;
  rfqItemId: string;
  materialCost: number;
  labourCost: number;
  equipmentCost: number;
  subcontractCost: number;
  transportationCost: number;
  otherDirectCost: number;
  overheadCost: number;
  contingencyCost: number;
  // Generated column in the DB (sum of the eight cost fields above),
  // carried here pre-computed by the fixture layer rather than derived
  // in every consumer.
  estimatedUnitCost: number;
  remarks: string | null;
};
