"use client";

// Segment error boundary for /reservations/new. Catches the Server Action
// throw on the client and offers recovery via unstable_retry (Next 16.2).
import { useEffect } from "react";

export default function NewBookingError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Client-side capture point for the action failure.
    console.error("[differ] action boundary captured:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="animate-signal-in max-w-xl rounded-2xl border-t-2 border-pulse-coral bg-pulse-coral/10 p-6">
        <p className="font-display text-xl font-bold text-pulse-coral">
          Booking save failed
        </p>
        <p className="mt-1 font-mono text-sm text-pulse-ink/80">
          Server Action threw{error.digest ? ` · digest ${error.digest}` : ""}.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-4 rounded-full bg-pulse-ink px-5 py-2.5 text-sm font-semibold text-pulse-bg transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
