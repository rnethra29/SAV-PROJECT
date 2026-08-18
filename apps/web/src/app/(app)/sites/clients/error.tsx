"use client";

import { useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";

type ClientListErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Next.js route-segment error boundary — catches unexpected render/hydration
// exceptions in this route. The GET /clients request itself (real backend
// call, see lib/sites/clients-api.ts) runs client-side inside
// ClientListContainer and handles its own loading/error/401 states without
// throwing, so this boundary is defense-in-depth rather than the primary
// error path for that request.
export default function ClientListError({ error, reset }: ClientListErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
      <AlertCircleIcon className="h-8 w-8 text-danger" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">Couldn&apos;t load clients</p>
        <p className="text-sm text-text-secondary">
          Something went wrong while loading the client list. Try again, and contact support if the problem
          continues.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </Panel>
  );
}
