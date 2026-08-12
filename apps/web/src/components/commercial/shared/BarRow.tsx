type BarRowProps = {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  color?: string;
  labelClassName?: string;
};

// One value as a horizontal bar against a shared max — used to compare
// several same-unit figures (e.g. quoted value per RFQ) as small multiples
// on a single scale, never as a second axis. Thin track, rounded fill,
// numeric value right-aligned in its own column so a stack of these reads
// as a table with an inline bar, not a decorative chart.
export function BarRow({ label, value, max, valueLabel, color = "var(--secondary)", labelClassName }: BarRowProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={labelClassName ?? "w-32 shrink-0 truncate text-xs text-text-secondary"}>{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/50">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-28 shrink-0 text-right text-xs font-medium text-text-primary">{valueLabel}</span>
    </div>
  );
}
