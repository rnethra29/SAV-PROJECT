import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Route group — doesn't affect the URL. Every future authenticated route
// nests here and gets the shell for free, instead of re-importing AppShell
// per page.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
