"use client";

import { useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";

type VendorListErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Next.js route-segment error boundary — defense-in-depth, same reasoning
// as sites/clients/error.tsx. The real GET /vendors request runs inside
// VendorListContainer and handles its own loading/error/401 states.
export default function VendorListError({ error, reset }: VendorListErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
      <AlertCircleIcon className="h-8 w-8 text-danger" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">Couldn&apos;t load vendors</p>
        <p className="text-sm text-text-secondary">
          Something went wrong while loading the vendor list. Try again, and contact support if the problem
          continues.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </Panel>
  );
}
