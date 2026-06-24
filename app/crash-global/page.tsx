"use client";

import { useState } from "react";
import { PulseChrome } from "@/components/PulseChrome";

// /crash-global — like /crash, but this segment has NO local error.tsx (nor any
// ancestor boundary), so the render throw bubbles all the way to
// app/global-error.tsx — the only deterministic way to demo the global lane.
//
// Stateful so the page still prerenders cleanly at build time.
export default function CrashGlobalPage() {
  const [boom, setBoom] = useState(false);

  if (boom) {
    throw new Error(
      "Deliberate client render crash with no local boundary (source: /crash-global) — bubbles to global-error",
    );
  }

  return (
    <PulseChrome>
      <div className="animate-rise max-w-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Global crash
        </h1>
        <p className="mt-2 text-lg text-pulse-muted">
          No local boundary guards this route, so clicking below takes down the
          whole app and app/global-error.tsx takes over.
        </p>
        <button
          onClick={() => setBoom(true)}
          className="mt-6 rounded-full bg-pulse-coral px-6 py-3 font-display text-base font-bold text-white transition hover:opacity-90"
        >
          Crash the whole app
        </button>
      </div>
    </PulseChrome>
  );
}
