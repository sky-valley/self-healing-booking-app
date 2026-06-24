// /api/boom-flaky — an INTERMITTENT 500. Fails roughly half the time.
//
// Unlike the always-on faults, this exercises the signal pipeline's dedup,
// rate tracking, and "is it actually healed?" detection — a single green
// response shouldn't be read as resolved.

export const dynamic = "force-dynamic";

export function GET() {
  if (Math.random() < 0.5) {
    throw new Error(
      "Deliberate intermittent 500 (flaky ~50%) — for dedup / heal-verification tests",
    );
  }
  return Response.json({
    ok: true,
    note: "passed this time — refresh to see it fail",
  });
}
