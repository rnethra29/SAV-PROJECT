"use client";

import { useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";

type ClientDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Next.js route-segment error boundary — see clients/error.tsx for why this
// is defense-in-depth rather than the primary error path (the real GET
// /clients/:id call runs inside ClientDetailContainer and handles its own
// loading/error/404/401 states without throwing).
export default function ClientDetailError({ error, reset }: ClientDetailErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
      <AlertCircleIcon className="h-8 w-8 text-danger" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">Couldn&apos;t load this client</p>
        <p className="text-sm text-text-secondary">
          Something went wrong. Try again, and contact support if the problem continues.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </Panel>
  );
}
