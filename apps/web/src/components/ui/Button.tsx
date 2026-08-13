import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "./icons";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-[transform,box-shadow,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

// Primary is the one dimensional surface on this screen. Depth comes only
// from layered, token-derived shadows (color-mix off --text-primary and
// --surface) — never a gradient fill. Ghost stays flat/text-style since
// it's a secondary action and shouldn't compete with Sign In for weight.
const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-text-primary px-4 py-2.5 " +
    "shadow-[0_1px_2px_color-mix(in_srgb,var(--text-primary)_10%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--surface)_35%,transparent)] " +
    "hover:brightness-95 hover:-translate-y-px hover:shadow-[0_4px_10px_-2px_color-mix(in_srgb,var(--text-primary)_18%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--surface)_35%,transparent)] " +
    "active:brightness-90 active:translate-y-0 active:shadow-[0_1px_1px_color-mix(in_srgb,var(--text-primary)_10%,transparent)]",
  ghost:
    "text-secondary hover:text-text-primary hover:underline underline-offset-2 active:brightness-90 px-1 py-1",
  danger:
    "bg-danger text-white px-4 py-2.5 " +
    "shadow-[0_1px_2px_color-mix(in_srgb,var(--text-primary)_10%,transparent)] " +
    "hover:brightness-95 hover:-translate-y-px active:brightness-90 active:translate-y-0",
};

export function Button({
  variant = "primary",
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {isLoading && <SpinnerIcon className="h-4 w-4" />}
      {children}
    </button>
  );
}
