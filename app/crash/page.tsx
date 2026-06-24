"use client";

import { useState } from "react";
import { PulseChrome } from "@/components/PulseChrome";

// /crash — a Client Component that throws during render once you click. The
// throw is caught by the co-located ./error.tsx boundary (the client render
// capture lane). "Try again" (unstable_retry) re-mounts this segment, which
// resets `boom` to false — a genuine self-heal recovery.
//
// Stateful (rather than throwing unconditionally) so the page still prerenders
// cleanly at build time.
export default function CrashPage() {
  const [boom, setBoom] = useState(false);

  if (boom) {
    throw new Error("Deliberate client render crash (source: /crash)");
  }

  return (
    <PulseChrome>
      <div className="animate-rise max-w-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Render crash
        </h1>
        <p className="mt-2 text-lg text-pulse-muted">
          Clicking below throws during render. The segment boundary
          (app/crash/error.tsx) catches it, and “Try again” recovers.
        </p>
        <button
          onClick={() => setBoom(true)}
          className="mt-6 rounded-full bg-pulse-coral px-6 py-3 font-display text-base font-bold text-white transition hover:opacity-90"
        >
          Crash this segment
        </button>
      </div>
    </PulseChrome>
  );
}
