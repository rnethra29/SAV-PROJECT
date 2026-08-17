export type PriceBasis =
  | "current_market"
  | "vendor_price"
  | "internal_purchase"
  | "historical_project"
  | "approved_estimation_rate"
  | "other";

export type ActualPrice = {
  id: string;
  rfqItemId: string;
  actualRate: number;
  unit: string;
  currency: string;
  priceBasis: PriceBasis;
  priceSourceReference: string | null;
  priceDate: string;
  remarks: string | null;
  updatedAt: string;
};

export type ActualPriceHistoryEntry = {
  id: string;
  rfqItemId: string;
  actualRate: number;
  priceBasis: PriceBasis;
  priceSourceReference: string | null;
  priceDate: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  remarks: string | null;
};
