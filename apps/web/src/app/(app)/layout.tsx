import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/layout/RequireAuth";

// Route group — doesn't affect the URL. Every future authenticated route
// nests here and gets the shell for free, instead of re-importing AppShell
// per page. RequireAuth gates the whole group on a real Supabase session.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
