"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
};

// Faint inset shadow (color-mix off --text-primary) gives the field a
// gently recessed feel relative to the raised card — dropped on error so
// the danger border isn't muddied by the neutral tint.
const restingFieldClasses =
  "border-border shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--text-primary)_4%,transparent)] hover:border-text-secondary";

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ id, label, error, className = "", ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-lg border bg-surface px-3 py-[11px] pr-10 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 ${
              error ? "border-danger" : restingFieldClasses
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            disabled={props.disabled}
            className="absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
          >
            {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
