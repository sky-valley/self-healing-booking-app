// proxy.ts — the renamed `middleware` (Next 16). Runs before routing.
//
// Throwing here returns a 500, but — verified against this build — the proxy
// runs in the edge layer and its throw is NOT delivered to the Node
// `onRequestError` hook. That capture blind spot is the point: it's a lane an
// observability tool can easily miss. The matcher pins it to /boom-proxy so it
// never runs on any real route.
//
// See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md

import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  throw new Error(
    `Deliberate 500 in proxy (path: ${request.nextUrl.pathname}) — routeType: 'proxy'`,
  );
}

export const config = {
  // Constant matcher (statically analyzed at build) — only this path.
  matcher: "/boom-proxy",
};
