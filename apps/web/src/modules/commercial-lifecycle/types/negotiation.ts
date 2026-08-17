export type OfferType = "sav_quote" | "client_offer" | "sav_counter" | "client_counter" | "final";

export type OfferParty = "sav" | "client";

export type OfferResponseStatus = "pending" | "accepted" | "rejected" | "countered";

export type NegotiationOffer = {
  id: string;
  quotationId: string;
  // Item-level negotiation when set; quotation-level (whole-offer) when null —
  // exactly one of offeredRate/offeredAmount is populated, matching which.
  quotationItemId: string | null;
  offerType: OfferType;
  offeredAmount: number | null;
  offeredRate: number | null;
  offeredBy: OfferParty;
  offerDate: string;
  responseStatus: OfferResponseStatus;
  paymentTerms: string | null;
  validityDate: string | null;
  commercialConditions: string | null;
  isFinal: boolean;
  remarks: string | null;
};
