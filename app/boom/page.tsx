// /boom — a page that throws during server render.
//
// `force-dynamic` (plus touching a request-time API) keeps this off the
// static-prerender path, so the throw happens at request time, NOT during
// `next build` — otherwise the build would fail. At request time Next returns
// HTTP 500, renders its error page, and fires `onRequestError`
// (routeType: 'render') — the path Differ observes for page renders.

import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function BoomPage() {
  // Read a request-time API so this route is never prerendered at build time.
  await headers();
  throw new Error("Deliberate 500 page render (source: /boom)");
}
