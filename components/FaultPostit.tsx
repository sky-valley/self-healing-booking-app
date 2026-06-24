"use client";

import { useState } from "react";
import { FAULTS, FAULT_GROUPS, faultsByGroup } from "@/lib/faults";

// A sticky yellow post-it pinned to the bottom-right of every page. Lists each
// deliberate fault with where to click to replicate it. Collapsible so it never
// blocks the UI. Rendered once from the root layout.
export function FaultPostit() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Show fault guide"
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 -rotate-3 place-items-center rounded-lg bg-yellow-300 text-xl font-bold text-amber-950 shadow-lg shadow-amber-900/20 transition hover:rotate-0"
      >
        ?
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[20rem] max-w-[calc(100vw-2.5rem)] -rotate-1 font-sans">
      {/* tape */}
      <div className="absolute -top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-sm bg-yellow-100/70 shadow-sm" />
      <div className="rounded-md bg-yellow-300 p-4 text-amber-950 shadow-xl shadow-amber-900/25">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-extrabold">
            🐛 Fault guide
          </p>
          <button
            onClick={() => setOpen(false)}
            aria-label="Hide fault guide"
            className="grid h-6 w-6 place-items-center rounded hover:bg-amber-950/10"
          >
            ×
          </button>
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-amber-900">
          {FAULTS.length} deliberate faults · click to replicate
        </p>

        <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {FAULT_GROUPS.map((group) => (
            <div key={group}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                {group}
              </p>
              <ul className="mt-1 space-y-2">
                {faultsByGroup(group).map((f) => (
                  <li
                    key={f.id}
                    className="rounded-sm border border-amber-950/10 bg-yellow-200/60 p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-bold leading-tight">
                        {f.title}
                      </span>
                      {f.href && (
                        <a
                          href={f.href}
                          className="shrink-0 rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-semibold text-yellow-200 transition hover:opacity-80"
                        >
                          {f.cta ?? "Go"}
                        </a>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] leading-tight text-amber-800">
                      {f.capture}
                    </p>
                    <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] leading-snug">
                      {f.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <a
          href="/faults"
          className="mt-3 block rounded-sm bg-amber-950 px-3 py-1.5 text-center text-xs font-bold text-yellow-200 transition hover:opacity-80"
        >
          Open the Fault Lab →
        </a>
      </div>
    </div>
  );
}
