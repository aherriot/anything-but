type LoadingScreenProps = {
  /** Accessible, human-readable description of what's loading. */
  label?: string;
};

/**
 * The product-wide loading indicator: an on-brand spinner announced to
 * assistive tech via `role="status"` + `aria-live`, so every waiting state
 * reads consistently instead of a bare "Loading..." string.
 */
export default function LoadingScreen({
  label = "Loading…",
}: LoadingScreenProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"
        aria-hidden="true"
      />
      <p className="mt-4 text-neutral-400">{label}</p>
    </div>
  );
}
