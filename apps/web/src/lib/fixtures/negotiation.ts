import type { NegotiationOffer } from "@/types/commercial/negotiation";

/**
 * TEMPORARY FRONTEND FIXTURE — no Negotiation backend endpoint exists yet.
 * Replace with real apiFetch("/negotiation-offers?quotationItemId=...")
 * calls once the Express com_negotiation_offers endpoint exists. Append-only
 * by design (Phase 8, rule 7) — every offer/counter-offer is a new row,
 * `isFinal` flags the settled offer where one has been reached.
 */

const negotiationFixtures: NegotiationOffer[] = [
  // 2.1(a) — settled at 202
  { id: "neg-0042-21a-1", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21a-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 210, offeredBy: "sav", offerDate: "2026-02-01T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-21a-2", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21a-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 190, offeredBy: "client", offerDate: "2026-02-03T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-21a-3", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21a-v1", offerType: "sav_counter", offeredAmount: null, offeredRate: 205, offeredBy: "sav", offerDate: "2026-02-05T10:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-21a-4", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21a-v1", offerType: "client_counter", offeredAmount: null, offeredRate: 200, offeredBy: "client", offerDate: "2026-02-07T14:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-21a-5", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21a-v1", offerType: "final", offeredAmount: null, offeredRate: 202, offeredBy: "sav", offerDate: "2026-02-10T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: "Mutually agreed final rate." },

  // 2.1(b) — settled at 148
  { id: "neg-0042-21b-1", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21b-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 155, offeredBy: "sav", offerDate: "2026-02-01T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-21b-2", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21b-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 140, offeredBy: "client", offerDate: "2026-02-03T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-21b-3", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-21b-v1", offerType: "final", offeredAmount: null, offeredRate: 148, offeredBy: "sav", offerDate: "2026-02-10T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: "Mutually agreed final rate." },

  // 2.2 — settled at 94
  { id: "neg-0042-22-1", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-22-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 98, offeredBy: "sav", offerDate: "2026-02-01T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-22-2", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-22-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 88, offeredBy: "client", offerDate: "2026-02-03T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-22-3", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-22-v1", offerType: "final", offeredAmount: null, offeredRate: 94, offeredBy: "sav", offerDate: "2026-02-10T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: "Mutually agreed final rate." },

  // 3.1 — settled at 8100
  { id: "neg-0042-31-1", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-31-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 8400, offeredBy: "sav", offerDate: "2026-02-01T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-31-2", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-31-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 7900, offeredBy: "client", offerDate: "2026-02-03T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-31-3", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-31-v1", offerType: "sav_counter", offeredAmount: null, offeredRate: 8150, offeredBy: "sav", offerDate: "2026-02-05T10:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-31-4", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-31-v1", offerType: "client_counter", offeredAmount: null, offeredRate: 8050, offeredBy: "client", offerDate: "2026-02-07T14:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0042-31-5", quotationId: "quo-0042-v1", quotationItemId: "qi-0042-31-v1", offerType: "final", offeredAmount: null, offeredRate: 8100, offeredBy: "sav", offerDate: "2026-02-10T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: "Mutually agreed final rate." },

  // RFQ-2026-0031 — settled
  { id: "neg-0031-11-1", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-11-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 185, offeredBy: "sav", offerDate: "2025-11-12T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0031-11-2", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-11-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 170, offeredBy: "client", offerDate: "2025-11-14T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0031-11-3", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-11-v1", offerType: "final", offeredAmount: null, offeredRate: 178, offeredBy: "sav", offerDate: "2025-11-20T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: null },

  { id: "neg-0031-12-1", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-12-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 3600, offeredBy: "sav", offerDate: "2025-11-12T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0031-12-2", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-12-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 3400, offeredBy: "client", offerDate: "2025-11-14T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0031-12-3", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-12-v1", offerType: "final", offeredAmount: null, offeredRate: 3500, offeredBy: "sav", offerDate: "2025-11-20T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: null },

  { id: "neg-0031-21-1", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-21-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 7900, offeredBy: "sav", offerDate: "2025-11-12T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0031-21-2", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-21-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 7500, offeredBy: "client", offerDate: "2025-11-14T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0031-21-3", quotationId: "quo-0031-v1", quotationItemId: "qi-0031-21-v1", offerType: "final", offeredAmount: null, offeredRate: 7700, offeredBy: "sav", offerDate: "2025-11-20T09:00:00.000Z", responseStatus: "accepted", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: true, remarks: null },

  // RFQ-2026-0028 — lost, no final agreement
  { id: "neg-0028-11-1", quotationId: "quo-0028-v1", quotationItemId: "qi-0028-11-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 180, offeredBy: "sav", offerDate: "2025-09-28T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0028-11-2", quotationId: "quo-0028-v1", quotationItemId: "qi-0028-11-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 160, offeredBy: "client", offerDate: "2025-10-05T11:00:00.000Z", responseStatus: "rejected", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: "Gap too wide — SAV declined to counter further, client awarded to competitor." },
  { id: "neg-0028-12-1", quotationId: "quo-0028-v1", quotationItemId: "qi-0028-12-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 3400, offeredBy: "sav", offerDate: "2025-09-28T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0028-12-2", quotationId: "quo-0028-v1", quotationItemId: "qi-0028-12-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 3000, offeredBy: "client", offerDate: "2025-10-05T11:00:00.000Z", responseStatus: "rejected", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: "Gap too wide — SAV declined to counter further, client awarded to competitor." },

  // RFQ-2026-0038 — in-progress negotiation, no final yet
  { id: "neg-0038-11-1", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-11-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 178, offeredBy: "sav", offerDate: "2025-12-20T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0038-11-2", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-11-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 165, offeredBy: "client", offerDate: "2026-01-10T11:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0038-11-3", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-11-v1", offerType: "sav_counter", offeredAmount: null, offeredRate: 172, offeredBy: "sav", offerDate: "2026-01-28T10:00:00.000Z", responseStatus: "pending", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: "Awaiting client response." },

  { id: "neg-0038-12-1", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-12-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 3350, offeredBy: "sav", offerDate: "2025-12-20T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0038-12-2", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-12-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 3100, offeredBy: "client", offerDate: "2026-01-10T11:00:00.000Z", responseStatus: "pending", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: "Awaiting SAV response." },

  { id: "neg-0038-21-1", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-21-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 7800, offeredBy: "sav", offerDate: "2025-12-20T09:00:00.000Z", responseStatus: "countered", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: null },
  { id: "neg-0038-21-2", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-21-v1", offerType: "client_offer", offeredAmount: null, offeredRate: 7300, offeredBy: "client", offerDate: "2026-01-10T11:00:00.000Z", responseStatus: "pending", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: "Awaiting SAV response." },

  { id: "neg-0038-22-1", quotationId: "quo-0038-v1", quotationItemId: "qi-0038-22-v1", offerType: "sav_quote", offeredAmount: null, offeredRate: 145, offeredBy: "sav", offerDate: "2025-12-20T09:00:00.000Z", responseStatus: "pending", paymentTerms: null, validityDate: null, commercialConditions: null, isFinal: false, remarks: "Awaiting client response." },
];

export async function getNegotiationOffersByQuotationItem(quotationItemId: string): Promise<NegotiationOffer[]> {
  return negotiationFixtures
    .filter((offer) => offer.quotationItemId === quotationItemId)
    .sort((a, b) => a.offerDate.localeCompare(b.offerDate));
}

export async function getNegotiationOffersByQuotation(quotationId: string): Promise<NegotiationOffer[]> {
  return negotiationFixtures
    .filter((offer) => offer.quotationId === quotationId)
    .sort((a, b) => a.offerDate.localeCompare(b.offerDate));
}

export async function getFinalOffer(quotationItemId: string): Promise<NegotiationOffer | null> {
  const offers = await getNegotiationOffersByQuotationItem(quotationItemId);
  return offers.find((o) => o.isFinal) ?? null;
}

export async function getLatestOffer(quotationItemId: string): Promise<NegotiationOffer | null> {
  const offers = await getNegotiationOffersByQuotationItem(quotationItemId);
  return offers[offers.length - 1] ?? null;
}
