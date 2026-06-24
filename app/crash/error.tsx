"use client";

// Segment error boundary for /crash. This is the canonical client render
// capture point — Differ observes uncaught render errors here — plus the
// self-heal loop via unstable_retry (re-fetches and re-renders the segment).
import { useEffect } from "react";

export default function CrashError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[differ] render boundary captured:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="animate-signal-in max-w-xl rounded-2xl border border-pulse-line bg-pulse-card p-6">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-pulse-coral text-lg font-bold text-white">
          !
        </span>
        <p className="mt-3 font-display text-2xl font-bold">
          Something went wrong
        </p>
        <p className="mt-1 font-mono text-sm text-pulse-muted">
          {error.message}
          {error.digest ? ` · digest ${error.digest}` : ""}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-5 rounded-full bg-pulse-ink px-5 py-2.5 text-sm font-semibold text-pulse-bg transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
