import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
};

export function Checkbox({ id, label, className = "", ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-text-secondary"
    >
      <input
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded border-border accent-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}
