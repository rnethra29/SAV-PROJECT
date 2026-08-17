import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersIcon } from "@/components/ui/icons";
import { OfferResponseBadge } from "@/modules/commercial-lifecycle/components/shared/StatusBadges";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { NegotiationOffer } from "@/modules/commercial-lifecycle/types/negotiation";

type ItemThread = {
  itemCode: string;
  description: string;
  offers: NegotiationOffer[];
};

type NegotiationTimelineProps = {
  threads: ItemThread[];
};

export function NegotiationTimeline({ threads }: NegotiationTimelineProps) {
  const activeThreads = threads.filter((thread) => thread.offers.length > 0);

  if (activeThreads.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<UsersIcon className="h-8 w-8" />}
          title="No negotiation activity yet"
          description="Offer and counter-offer history will appear here once negotiation begins on the quotation."
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {activeThreads.map((thread) => {
        const finalOffer = thread.offers.find((o) => o.isFinal);
        return (
          <Panel key={thread.itemCode} className="bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
              <p className="text-sm font-medium text-text-primary">
                {thread.itemCode} — <span className="font-normal">{thread.description}</span>
              </p>
              {finalOffer && (
                <span className="text-sm font-semibold text-success">
                  Final Agreed: {formatCurrency(finalOffer.offeredRate)}
                </span>
              )}
            </div>
            <ol className="space-y-0 p-4">
              {thread.offers.map((offer, index) => (
                <li key={offer.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < thread.offers.length - 1 && (
                    <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden="true" />
                  )}
                  <div
                    className={`z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                      offer.isFinal
                        ? "border-success bg-success"
                        : offer.offeredBy === "sav"
                          ? "border-primary bg-primary"
                          : "border-secondary bg-surface"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {offer.offeredBy === "sav" ? "SAV" : "Client"}
                        <span className="ml-2 font-normal text-text-secondary">
                          {formatCurrency(offer.offeredRate)}
                        </span>
                      </p>
                      <OfferResponseBadge status={offer.responseStatus} />
                    </div>
                    <p className="text-xs text-text-secondary">{formatDateTime(offer.offerDate)}</p>
                    {offer.remarks && <p className="mt-1 text-sm text-text-secondary">{offer.remarks}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        );
      })}
    </div>
  );
}
