"use client";

import { useState } from "react";
import { UpstreamError } from "@/lib/errors";

// Interactive triggers for the pure-client capture lanes — the ones that can't
// be a URL because they fire window.onerror / window.onunhandledrejection in
// the browser. Each button surfaces an uncaught error that escapes React.

type Trigger = {
  id: string;
  label: string;
  note: string;
  fire: () => void;
};

const TRIGGERS: Trigger[] = [
  {
    id: "unhandled-rejection",
    label: "Unhandled rejection",
    note: "window.onunhandledrejection",
    fire: () => {
      // A floating rejected promise with no .catch.
      void Promise.reject(
        new Error("Differ test: unhandled promise rejection from Fault Lab"),
      );
    },
  },
  {
    id: "sync-throw",
    label: "Throw in handler",
    note: "window.onerror — boundaries don't catch event handlers",
    fire: () => {
      throw new Error("Differ test: uncaught error inside an event handler");
    },
  },
  {
    id: "non-error-throw",
    label: "Throw non-Error",
    note: "rejection with a plain object (serialization edge case)",
    fire: () => {
      // Intentionally NOT an Error instance.
      void Promise.reject({
        code: "WEIRD_SHAPE",
        message: "Differ test: a non-Error value was thrown",
      });
    },
  },
  {
    id: "cause-chain",
    label: "Throw with cause",
    note: "UpstreamError { cause } via rejection",
    fire: () => {
      const root = new Error("socket hang up (ECONNRESET)");
      void Promise.reject(
        new UpstreamError("Differ test: upstream call failed", { cause: root }),
      );
    },
  },
  {
    id: "type-error",
    label: "TypeError",
    note: "undefined.toUpperCase() — the classic null drift",
    fire: () => {
      const value = undefined as unknown as string;
      value.toUpperCase();
    },
  },
];

export function ClientFaults() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-pulse-line bg-pulse-card p-6">
      <h2 className="font-display text-2xl font-bold">Client triggers</h2>
      <p className="mt-1 max-w-lg text-sm text-pulse-muted">
        These fire uncaught errors in the browser. Open the console (or watch
        Differ) to see each one surface.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {TRIGGERS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setLast(t.label);
              t.fire();
            }}
            title={t.note}
            className="rounded-full border border-pulse-line bg-pulse-bg px-4 py-2 text-sm font-semibold transition hover:border-pulse-coral hover:text-pulse-coral"
          >
            {t.label}
          </button>
        ))}
      </div>
      {last && (
        <p className="animate-signal-in mt-4 font-mono text-xs text-pulse-muted">
          Fired “{last}” — check the console / Differ signal plane.
        </p>
      )}
    </section>
  );
}
