// /api/export/activities — the reservations export feed.
//
// The backend was renamed `party_size` -> `covers`, so rows are emitted with
// `covers`. The frontend CSV builder still reads `party_size`, so the export
// fails. This is the real contract drift for Differ to observe and heal.

import { NextResponse } from "next/server";
import { RESERVATIONS } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET() {
  const rows = RESERVATIONS.map((r) => ({
    date: r.date,
    time: r.time,
    guest: r.guest,
    area: r.area,
    status: r.status,
    covers: r.covers,
  }));

  return NextResponse.json({ surface: "export", rows });
}
