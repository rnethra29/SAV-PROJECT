"use client";

import { useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";

type RfqListErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Next.js route-segment error boundary — activates if data loading or
// rendering under /commercial/rfq throws. The fixture data source never
// throws today; this is the real seam that takes over once getRfqList()
// is backed by a live API call that can fail.
export default function RfqListError({ error, reset }: RfqListErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
      <AlertCircleIcon className="h-8 w-8 text-danger" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">Couldn&apos;t load RFQs</p>
        <p className="text-sm text-text-secondary">
          Something went wrong while loading the RFQ list. Try again, and contact support if the problem
          continues.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </Panel>
  );
}
