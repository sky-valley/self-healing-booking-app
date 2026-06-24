"use client";

// app/global-error.tsx — the outermost error boundary. It catches errors that
// escape every nested boundary (and errors in the root layout itself), and
// REPLACES the root layout, so it must render its own <html>/<body>.
//
// Triggered by /crash-global (a render throw with no nearer boundary).
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[differ] GLOBAL error boundary captured:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-pulse-bg text-pulse-ink">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-pulse-coral text-xl font-bold text-white">
            !
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
            The whole app crashed
          </h1>
          <p className="mt-2 font-mono text-sm text-pulse-muted">
            global-error caught: {error.message}
            {error.digest ? ` · digest ${error.digest}` : ""}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => unstable_retry()}
              className="rounded-full bg-pulse-ink px-5 py-2.5 text-sm font-semibold text-pulse-bg transition hover:opacity-90"
            >
              Try again
            </button>
            {/* Hard navigation on purpose: a full reload is the cleanest
                recovery after the root layout has been torn down. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-full border border-pulse-line px-5 py-2.5 text-sm font-semibold transition hover:bg-pulse-line/50"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
