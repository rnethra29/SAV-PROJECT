import type { VndVendorPerformance } from "@/types/sites/vendor-performance";

type FieldProps = {
  label: string;
  value: string;
};

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

type VendorPerformanceStatsViewProps = {
  performance: VndVendorPerformance;
};

/**
 * Pure rendering of v_vendor_performance (doc §6.17) — every figure here is
 * calculated by the view, never stored (doc §10): PO counts/delayed
 * deliveries from vnd_purchase_order, rating averages from
 * vnd_vendor_rating.
 */
export function VendorPerformanceStatsView({ performance }: VendorPerformanceStatsViewProps) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Total POs" value={performance.total_pos} />
        <Field label="Completed" value={performance.completed_pos} />
        <Field label="Pending" value={performance.pending_pos} />
        <Field label="Cancelled" value={performance.cancelled_pos} />
      </dl>
      <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Delayed Deliveries" value={performance.delayed_deliveries} />
        <Field
          label="On-Time Delivery"
          value={performance.on_time_delivery_percentage != null ? `${performance.on_time_delivery_percentage}%` : "No completed POs yet"}
        />
        <Field label="Avg. Quality" value={performance.avg_quality_rating != null ? `${performance.avg_quality_rating} / 5` : "—"} />
        <Field label="Avg. Delivery" value={performance.avg_delivery_rating != null ? `${performance.avg_delivery_rating} / 5` : "—"} />
      </dl>
      <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Avg. Price" value={performance.avg_price_rating != null ? `${performance.avg_price_rating} / 5` : "—"} />
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Overall Rating</dt>
          <dd className="mt-0.5 text-base font-semibold text-text-primary">
            {performance.overall_rating != null ? `${performance.overall_rating} / 5` : "No ratings yet"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
