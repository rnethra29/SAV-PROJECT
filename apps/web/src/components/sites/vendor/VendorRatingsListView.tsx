import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUpIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { VndVendorRating } from "@/types/sites/vendor-performance";
import type { VndPurchaseOrder } from "@/types/sites/procurement-order";

type VendorRatingsListViewProps = {
  ratings: VndVendorRating[];
  purchaseOrders: VndPurchaseOrder[];
};

/** Pure list/table rendering of a vendor's ratings (vnd_vendor_rating, doc §6.10 — append-only, newest first). */
export function VendorRatingsListView({ ratings, purchaseOrders }: VendorRatingsListViewProps) {
  const poNumber = (poId: string | null) => (poId ? purchaseOrders.find((po) => po.po_id === poId)?.po_number ?? "—" : "—");

  if (ratings.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUpIcon className="h-8 w-8" />}
        title="No ratings yet"
        description="Rate this vendor's delivery, quality and price after a purchase order to build up performance history."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Rated</th>
            <th className="px-5 py-3 font-medium">Purchase Order</th>
            <th className="px-5 py-3 text-right font-medium">Quality</th>
            <th className="px-5 py-3 text-right font-medium">Delivery</th>
            <th className="px-5 py-3 text-right font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((rating) => (
            <tr key={rating.rating_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(rating.rated_at)}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{poNumber(rating.purchase_order_id)}</td>
              <td className="px-5 py-3 text-right text-text-primary">{rating.quality_rating} / 5</td>
              <td className="px-5 py-3 text-right text-text-primary">{rating.delivery_rating} / 5</td>
              <td className="px-5 py-3 text-right text-text-primary">{rating.price_rating} / 5</td>
              <td className="px-5 py-3 text-text-secondary">{rating.remarks ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
