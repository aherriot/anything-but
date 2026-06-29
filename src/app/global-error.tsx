"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";
import "./globals.css";

/**
 * Last-resort boundary for errors thrown in the root layout itself, which the
 * segment-level error.tsx can't catch. It replaces the whole document, so it
 * must render its own <html>/<body> and pull in global styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-neutral-900">
        <ErrorState onRetry={reset} />
      </body>
    </html>
  );
}
