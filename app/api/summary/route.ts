// /api/summary — powers the everyday dashboard. STABLE. Never drifts.
// The dashboard depends only on this path, so the app stays visibly healthy
// no matter what happens to the export contract.

import { NextResponse } from "next/server";
import { SUMMARY } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(SUMMARY);
}
