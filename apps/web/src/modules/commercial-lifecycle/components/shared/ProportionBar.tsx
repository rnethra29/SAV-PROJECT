export type ProportionSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type ProportionBarProps = {
  segments: ProportionSegment[];
};

// Segmented proportion bar for categorical distribution (e.g. RFQ count by
// lifecycle status) — a 2px surface gap between segments so adjacent fills
// never visually merge, a legend below with the count directly labeled
// (never color-alone), zero-value segments dropped rather than rendered as
// slivers.
export function ProportionBar({ segments }: ProportionBarProps) {
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <div className="h-3 w-full rounded-full bg-border/40" />;
  }

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px]">
        {visible.map((segment) => (
          <div
            key={segment.key}
            title={`${segment.label}: ${segment.value}`}
            className="h-full rounded-full"
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {visible.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label} <span className="font-medium text-text-primary">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
