// Observability entry point. `onRequestError` is the exact server-side hook
// Differ observes — this local implementation just logs each captured fault so
// every server lane (route / render / action / proxy, node or edge) is visible
// in the dev console and assertable in this testbed.
//
// See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md

import { type Instrumentation } from "next";

export function register() {
  console.log(
    `[differ] instrumentation.register — runtime=${process.env.NEXT_RUNTIME ?? "node"}`,
  );
}

export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  const e = err as Error & { digest?: string };
  console.error(
    `[differ] onRequestError` +
      ` lane=${context.routeType}` +
      ` route=${context.routePath}` +
      ` router=${context.routerKind}` +
      ` runtime=${process.env.NEXT_RUNTIME ?? "node"}` +
      ` method=${request.method}` +
      ` path=${request.path}` +
      ` digest=${e.digest ?? "-"}` +
      ` :: ${e.name}: ${e.message}`,
  );
};
