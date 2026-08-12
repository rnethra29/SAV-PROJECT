import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
};

const restingFieldClasses =
  "border-border shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--text-primary)_4%,transparent)] hover:border-text-secondary";

export function TextArea({ id, label, error, className = "", rows = 3, ...props }: TextAreaProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-[11px] text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 ${
          error ? "border-danger" : restingFieldClasses
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
