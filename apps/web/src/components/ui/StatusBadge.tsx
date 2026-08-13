export type StatusTone = "inactive" | "info" | "warning" | "secondary" | "primary" | "success" | "danger";

// Shared with RfqStatusBadge's original inline classes — factored out once
// a second/third status-enum badge needed the identical rendering.
export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  inactive: "border-inactive/30 bg-inactive/10 text-text-secondary",
  info: "border-info/30 bg-info/10 text-info",
  warning: "border-warning/30 bg-warning/10 text-warning",
  secondary: "border-secondary/30 bg-secondary/10 text-secondary",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

// Solid-fill equivalent of the tones above, for use as a chart mark color
// (ProportionBar/BarRow) rather than a badge's tinted border/background.
export const STATUS_TONE_COLOR: Record<StatusTone, string> = {
  inactive: "var(--inactive)",
  info: "var(--info)",
  warning: "var(--warning)",
  secondary: "var(--secondary)",
  primary: "var(--primary)",
  success: "var(--success)",
  danger: "var(--danger)",
};

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
