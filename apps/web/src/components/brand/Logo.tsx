type LogoProps = {
  variant?: "full" | "mark";
  className?: string;
};

// Temporary placeholder mark — the official SAV Wind Foundations logo has
// not been provided yet. When it arrives, replace the <svg> below (or swap
// in an <Image>) in this one file; every consumer just renders <Logo />.
export function Logo({ variant = "full", className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0 text-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
        <path d="M16 16 15 4.5" />
        <path d="M16 16 24.5 19.5" />
        <path d="M16 16 8 21" />
      </svg>
      {variant === "full" && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-wide text-text-on-sidebar">
            SAV Wind Foundations
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-on-sidebar/70">
            Enterprise ERP
          </p>
        </div>
      )}
    </div>
  );
}
