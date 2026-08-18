"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { Checkbox } from "@/components/ui/Checkbox";
import { AuthAlert } from "@/components/ui/AuthAlert";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { getSupabaseClient } from "@/lib/supabase/client";

type LoginCredentials = { email: string; password: string; rememberMe: boolean };
type LoginResult = { ok: true } | { ok: false; kind: "invalid-credentials" | "service-unavailable" };
type FieldErrors = { email?: string; password?: string };
type AuthErrorState = { kind: "invalid-credentials" | "service-unavailable" } | null;

/**
 * Real Supabase Auth sign-in (architecture: User -> Supabase Auth ->
 * session -> JWT -> apiFetch -> backend, see src/middlewares/auth.middleware.js).
 * The password goes straight to Supabase over the SDK — it never touches our
 * own backend and we never store it. Supabase's own error text isn't shown
 * verbatim (it can be more specific than we want to expose to the client);
 * it's mapped to the existing two-kind AuthAlert contract instead.
 */
async function submitLogin(credentials: LoginCredentials): Promise<LoginResult> {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { ok: false, kind: "service-unavailable" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (!error) return { ok: true };

  // Supabase reports wrong email/password as a 400; anything else (network,
  // 5xx, rate limiting) is reported as a generic service issue rather than
  // leaking Supabase-specific error detail to the user.
  if (error.status === 400) {
    return { ok: false, kind: "invalid-credentials" };
  }
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
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<AuthErrorState>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const passwordRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  // Already-authenticated visitors (e.g. a second tab, or the session was
  // already valid on page load) don't need the form — send them straight to
  // the app, same destination as a fresh sign-in below.
  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

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

    router.replace("/dashboard");
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
