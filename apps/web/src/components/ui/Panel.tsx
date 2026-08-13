import type { HTMLAttributes } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement>;

// Deliberately background-agnostic — only border/radius/shadow are fixed.
// Consumers set their own bg-* via className; Tailwind's generated-CSS
// ordering isn't determined by className string order, so two competing
// bg-* utilities on the same element would be non-deterministic. Same
// reasoning applies to border color: only Panel sets it, never a consumer.
export function Panel({ className = "", ...props }: PanelProps) {
  return (
    <div
      className={`rounded-xl border border-border shadow-[0_1px_2px_color-mix(in_srgb,var(--text-primary)_5%,transparent)] ${className}`}
      {...props}
    />
  );
}
