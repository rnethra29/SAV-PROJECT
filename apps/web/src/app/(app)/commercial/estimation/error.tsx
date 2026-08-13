"use client";

import { ListPageError } from "@/components/commercial/shared/ListPageError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ListPageError error={error} reset={reset} title="Couldn't load Estimation" />;
}
