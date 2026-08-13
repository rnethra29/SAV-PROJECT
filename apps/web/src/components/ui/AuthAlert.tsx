import { AlertCircleIcon } from "./icons";

type AuthAlertKind = "invalid-credentials" | "service-unavailable";

type AuthAlertProps = {
  kind: AuthAlertKind;
};

// Body text stays --text-primary regardless of kind — Section D of the
// context doc requires status to read as a badge (icon + tinted border,
// not colored paragraph text), so only the icon and border carry the tone.
const COPY: Record<AuthAlertKind, string> = {
  "invalid-credentials": "We couldn't sign you in. Check your email and password and try again.",
  "service-unavailable":
    "The sign-in service is temporarily unavailable. Please try again in a few minutes.",
};

const TONE: Record<AuthAlertKind, { border: string; icon: string; bg: string }> = {
  "invalid-credentials": { border: "border-danger/30", icon: "text-danger", bg: "bg-danger/5" },
  "service-unavailable": { border: "border-warning/30", icon: "text-warning", bg: "bg-warning/5" },
};

export function AuthAlert({ kind }: AuthAlertProps) {
  const tone = TONE[kind];

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 ${tone.border} ${tone.bg}`}
    >
      <AlertCircleIcon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} />
      <p className="text-sm text-text-primary">{COPY[kind]}</p>
    </div>
  );
}
