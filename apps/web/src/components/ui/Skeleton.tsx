type SkeletonProps = {
  className?: string;
  // Explicit prop rather than a className bg-* override — two competing
  // bg-* utilities on one element aren't reliably resolved by className
  // string order in Tailwind's generated CSS (see Panel.tsx).
  tone?: "default" | "on-dark";
};

export function Skeleton({ className = "", tone = "default" }: SkeletonProps) {
  const toneClasses = tone === "on-dark" ? "bg-text-on-sidebar/10" : "bg-border/60";
  return <div aria-hidden="true" className={`animate-pulse rounded-md ${toneClasses} ${className}`} />;
}
