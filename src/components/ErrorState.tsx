import Link from "next/link";
import { Button } from "@/components/Button";

type ErrorStateProps = {
  title?: string;
  message?: string;
  /** When provided, renders a "Try again" button that re-runs the failed render. */
  onRetry?: () => void;
};

/**
 * The product-wide error screen. Kept on-brand (dark canvas, warm gradient
 * heading) and consistent so every boundary in the app fails the same way.
 */
export default function ErrorState({
  title = "We dropped the plate",
  message = "Something went wrong on our end while setting the table. It's not you — give it another try in a moment.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="min-h-screen bg-neutral-900 flex items-center justify-center p-6"
      role="alert"
    >
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-6" aria-hidden="true">
          🍽️
        </div>
        <h1 className="heading-lg text-gradient-warm mb-4">{title}</h1>
        <p className="body-lg text-neutral-300 mb-8">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Link
            href="/"
            className="rounded-md bg-transparent text-primary-500 hover:bg-primary-500/10 focus:bg-primary-500/10 py-2 px-6 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
