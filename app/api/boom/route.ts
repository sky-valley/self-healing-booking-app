// /api/boom — deliberate server fault for testing 500 capture.
//
// Throws an uncaught error so Next returns HTTP 500 and invokes
// `onRequestError` (routeType: 'route') — the exact server-side path that
// Differ's server-error tracking observes. Trigger it by hitting
// /api/boom directly, or via the "Throw a 500" button on the dashboard.

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const label =
    new URL(request.url).searchParams.get("label") ?? "direct request";
  throw new Error(`Deliberate 500 for fault-capture test (source: ${label})`);
}
