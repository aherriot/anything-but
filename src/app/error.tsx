"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

/**
 * Catches render/runtime errors anywhere in the route tree below the root
 * layout (home, /start, /groups/[id], …) so a thrown exception — e.g. the
 * InstantDB client failing on a bad app id or an outage — shows a friendly,
 * on-brand screen instead of a white page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for logging/monitoring. Swap for a reporter (e.g. Sentry) later.
    console.error(error);
  }, [error]);

  return <ErrorState onRetry={reset} />;
}
