import type { SelectHTMLAttributes } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  // Toolbar filters (search/status/sort) want the field visually compact
  // with only an accessible label — "sr-only" keeps them in the a11y tree
  // without the vertical label row TextField-style forms use.
  labelClassName?: string;
};

const restingFieldClasses =
  "border-border shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--text-primary)_4%,transparent)] hover:border-text-secondary";

export function Select({
  id,
  label,
  options,
  placeholder,
  error,
  labelClassName = "block text-sm font-medium text-text-primary",
  className = "",
  ...props
}: SelectProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-[11px] text-sm text-text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 ${
          error ? "border-danger" : restingFieldClasses
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
