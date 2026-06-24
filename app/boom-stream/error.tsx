"use client";

// Segment boundary for /boom-stream. The shell already streamed, so this
// replaces just the failed slot with a graceful notice (and a retry).
import { useEffect } from "react";

export default function BoomStreamError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[differ] streaming boundary captured:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="animate-signal-in rounded-2xl border-t-2 border-pulse-coral bg-pulse-coral/10 p-6">
        <p className="font-display text-xl font-bold text-pulse-coral">
          Live section failed mid-stream
        </p>
        <p className="mt-1 font-mono text-sm text-pulse-ink/80">
          {error.message}
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
