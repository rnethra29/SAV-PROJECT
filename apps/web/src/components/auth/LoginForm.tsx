"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { Checkbox } from "@/components/ui/Checkbox";
import { AuthAlert } from "@/components/ui/AuthAlert";

type LoginCredentials = { email: string; password: string; rememberMe: boolean };
type LoginResult = { ok: true } | { ok: false; kind: "invalid-credentials" | "service-unavailable" };
type FieldErrors = { email?: string; password?: string };
type AuthErrorState = { kind: "invalid-credentials" | "service-unavailable" } | null;

// TEMPORARY — no auth backend exists yet (Module 1 backend not built).
// Replace this function with a real call through apiFetch("/auth/login", …)
// once the Express auth endpoint exists. Until then it honestly reports the
// service as unavailable rather than simulating a credential check.
async function submitLogin(credentials: LoginCredentials): Promise<LoginResult> {
  void credentials;
  return { ok: false, kind: "service-unavailable" };
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your work email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return "Enter your password.";
  return undefined;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<AuthErrorState>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const passwordRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      return;
    }

    setFieldErrors({});
    setAuthError(null);
    submittingRef.current = true;
    setStatus("submitting");

    const result = await submitLogin({ email, password, rememberMe });

    submittingRef.current = false;
    setStatus("idle");

    if (!result.ok) {
      setAuthError({ kind: result.kind });
      if (result.kind === "invalid-credentials") {
        setPassword("");
        passwordRef.current?.focus();
      }
      return;
    }

    // No authenticated destination exists yet (app shell not built).
    // Real navigation is added once that shell exists.
  }

  // Forgot Password has no destination screen yet — kept as an isolated,
  // intentionally-unimplemented handler rather than a link to a route that
  // doesn't exist. Do not add navigation here until that screen is designed.
  function handleForgotPassword() {}

  return (
    <form noValidate onSubmit={handleSubmit} className="w-full space-y-6">
      {authError && <AuthAlert kind={authError.kind} />}

      <div className="space-y-5">
        <TextField
          id="email"
          label="Work Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
          error={fieldErrors.email}
          disabled={status === "submitting"}
          required
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() =>
            setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))
          }
          error={fieldErrors.password}
          disabled={status === "submitting"}
          ref={passwordRef}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          id="remember-me"
          label="Remember me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={status === "submitting"}
        />
        <Button variant="ghost" onClick={handleForgotPassword} disabled={status === "submitting"}>
          Forgot Password
        </Button>
      </div>

      <Button type="submit" fullWidth isLoading={status === "submitting"}>
        {status === "submitting" ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
