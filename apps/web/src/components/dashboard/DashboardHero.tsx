import Image from "next/image";
import type { CurrentUser } from "@/types/dashboard";
import { QuickActions } from "./QuickActions";
import { Panel } from "@/components/ui/Panel";

// Single, centralized reference — replace this one path to swap the hero
// asset later. Real product asset (not a reference/mock), per instruction.
const HERO_IMAGE_SRC = "/images/sav-wind-farm-dashboard-hero.png";

type DashboardHeroProps = {
  currentUser: CurrentUser;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero({ currentUser }: DashboardHeroProps) {
  return (
    <Panel className="relative overflow-hidden bg-sidebar-background">
      <div className="absolute inset-0">
        {/* Blue sky/turbines stay recognizable — light saturation trim only,
            no grayscale. A directional gradient (not a flat wash) carries
            the contrast: strong behind the text on the left, easing off
            toward the right where the photo itself is the point. */}
        <Image
          src={HERO_IMAGE_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_42%] saturate-90"
        />
        {/* Held-opaque left zone (through 40%, unchanged), then the fade
            pushed further right than before — full clarity now concentrates
            in just the last ~1-9% of the frame instead of the last ~13%. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--sidebar-background)_0%,var(--sidebar-background)_40%,color-mix(in_srgb,var(--sidebar-background)_65%,transparent)_62%,color-mix(in_srgb,var(--sidebar-background)_42%,transparent)_78%,color-mix(in_srgb,var(--sidebar-background)_20%,transparent)_90%,transparent_99%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sidebar-background to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-10">
        <div className="max-w-xl">
          {/* No session data exists yet — a generic time-based greeting is
              real, honest content (not a fabricated name), unlike a loading
              skeleton that would never resolve without an auth backend. */}
          <h1 className="text-2xl font-semibold tracking-tight text-text-on-sidebar lg:text-3xl">
            {getGreeting()}
            {currentUser && (
              <>
                , <span className="text-primary">{currentUser.fullName}</span>
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-text-on-sidebar/70">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <QuickActions />
      </div>
    </Panel>
  );
}
