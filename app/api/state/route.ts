// /api/state — full demo state. Both views poll this to stay synchronized.

import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(store.get());
}
