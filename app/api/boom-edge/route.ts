// /api/boom-edge — same deliberate 500 as /api/boom, but in the EDGE runtime.
//
// Capture still flows through onRequestError (routeType: 'route'), but with
// NEXT_RUNTIME === 'edge' — a different process/instrumentation path worth
// exercising separately from the Node.js route handler.

export const runtime = "edge";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const label =
    new URL(request.url).searchParams.get("label") ?? "direct request";
  throw new Error(`Deliberate 500 from EDGE runtime (source: ${label})`);
}
