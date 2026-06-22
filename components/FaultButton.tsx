"use client";

import { useState } from "react";

// Triggers /api/boom, which throws server-side so Next returns a 500 and
// fires `onRequestError`. Surfaces the resulting HTTP status so you can
// confirm the fault actually fired.
type Outcome =
  | { kind: "ok"; status: number }
  | { kind: "neterror"; message: string };

export function FaultButton() {
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function boom() {
    setPending(true);
    setOutcome(null);
    try {
      const res = await fetch("/api/boom?label=dashboard-button", {
        cache: "no-store",
      });
      setOutcome({ kind: "ok", status: res.status });
    } catch (e) {
      setOutcome({
        kind: "neterror",
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-pulse-line bg-pulse-card px-5 py-6">
      <h2 className="font-display text-2xl font-bold">Fault injection</h2>
      <p className="mt-1 max-w-lg text-sm text-pulse-muted">
        Fire a deliberate server-side error to verify 500 capture end to end.
        Hits <code className="font-mono text-pulse-ink">/api/boom</code>, which
        throws on the server.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={boom}
          disabled={pending}
          className="rounded-full bg-pulse-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Throwing…" : "Throw a 500"}
        </button>
        {/* Full page load so the actual Next.js 500 error page renders. */}
        <a
          href="/boom"
          className="rounded-full border border-pulse-line px-5 py-2.5 text-sm font-semibold text-pulse-ink transition hover:bg-pulse-line/50"
        >
          Open a 500 page
        </a>
        {outcome?.kind === "ok" && (
          <span
            className={`text-sm font-semibold ${
              outcome.status >= 500 ? "text-pulse-coral" : "text-pulse-muted"
            }`}
          >
            Server responded {outcome.status}
            {outcome.status >= 500 ? " — fault fired ✓" : ""}
          </span>
        )}
        {outcome?.kind === "neterror" && (
          <span className="text-sm font-semibold text-pulse-coral">
            Request failed: {outcome.message}
          </span>
        )}
      </div>
    </section>
  );
}
