// /boom-stream — a render fault that throws AFTER the 200 shell has flushed.
//
// The page shell streams immediately; a suspended async server child then
// throws mid-stream. Capture flows through onRequestError (routeType:
// 'render') but the response status is already 200 — the nasty partial-
// response case. ./error.tsx degrades the suspended slot gracefully.

import { Suspense } from "react";
import { PulseChrome } from "@/components/PulseChrome";

export const dynamic = "force-dynamic";

async function LiveSection(): Promise<React.ReactElement> {
  // Let the shell flush first, then blow up inside the stream.
  await new Promise((resolve) => setTimeout(resolve, 600));
  throw new Error(
    "Deliberate streaming error — suspended child threw after the 200 shell flushed",
  );
}

export default function BoomStreamPage() {
  return (
    <PulseChrome>
      <div className="animate-rise">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Streaming fault
        </h1>
        <p className="mt-2 max-w-xl text-lg text-pulse-muted">
          The shell renders instantly, then a suspended server component throws
          while the response is still streaming.
        </p>
        <section className="mt-8 rounded-2xl border border-pulse-line bg-pulse-card p-6">
          <Suspense
            fallback={
              <p className="font-mono text-sm text-pulse-muted">
                Loading live section…
              </p>
            }
          >
            <LiveSection />
          </Suspense>
        </section>
      </div>
    </PulseChrome>
  );
}
