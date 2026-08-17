"use client";

import { ListPageError } from "@/modules/commercial-lifecycle/components/shared/ListPageError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ListPageError error={error} reset={reset} title="Couldn't load Profit Analysis" />;
}
