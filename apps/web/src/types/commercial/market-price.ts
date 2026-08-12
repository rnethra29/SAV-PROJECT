export type MarketPriceReference = {
  id: string;
  rfqItemId: string;
  sourceTypeId: string;
  sourceTypeName: string;
  sourceReference: string | null;
  rate: number;
  unit: string;
  currency: string;
  priceDate: string;
  remarks: string | null;
  createdAt: string;
};
