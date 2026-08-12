import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In · SAV ERP",
  description: "Sign in to the SAV Wind Foundations Enterprise ERP.",
};

// Card shadow tinted from --text-primary via color-mix rather than plain
// black, so depth reads as part of the same brand system as the dashboard.
const cardShadow =
  "lg:shadow-[0_1px_2px_color-mix(in_srgb,var(--text-primary)_6%,transparent),0_16px_32px_-12px_color-mix(in_srgb,var(--text-primary)_16%,transparent)]";

export default function LoginPage() {
  return (
    <main className="flex w-full flex-1 flex-col lg:flex-row 2xl:mx-auto 2xl:max-w-[1600px]">
      <section className="relative flex flex-col justify-center overflow-hidden bg-sidebar-background px-6 py-8 lg:w-[45%] lg:px-12 lg:py-12">
        {/* Wind-farm construction photo: desaturated, espresso-multiplied,
            edge-masked so it dissolves into the panel rather than sitting
            in a hard rectangle. Desktop only, decorative, behind the text —
            never competes with the form. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden lg:block [mask-image:radial-gradient(65%_75%_at_28%_35%,black_35%,transparent_88%)] [-webkit-mask-image:radial-gradient(65%_75%_at_28%_35%,black_35%,transparent_88%)]"
        >
          <Image
            src="/images/sav-wind-login-bg.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover object-[20%_30%] grayscale contrast-[1.05] brightness-90"
          />
          <div className="absolute inset-0 bg-sidebar-background/80 mix-blend-multiply" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-sm lg:mx-0">
          <p className="text-xl font-semibold tracking-wide text-text-on-sidebar lg:text-2xl">
            SAV Wind Foundations
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-text-on-sidebar/70">
            Enterprise ERP
          </p>
          <div className="mt-6 hidden h-px w-12 bg-primary lg:block" />
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-background px-6 py-10 lg:px-12 lg:py-12">
        <div
          className={`w-full max-w-[420px] rounded-xl border border-border bg-surface p-6 lg:p-10 ${cardShadow}`}
        >
          <h1 className="text-2xl font-semibold tracking-tight leading-tight text-text-primary lg:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 mb-9 text-sm text-text-secondary">
            Sign in to access your workspace.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
