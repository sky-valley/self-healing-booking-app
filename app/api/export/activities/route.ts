// /api/export/activities — the rarely-clicked cold path. Its response SHAPE is
// controlled by the drift flag in the store:
//   drift ON  (demo default): rows carry `covers`      (post-rename)
//   drift OFF (legacy):       rows carry `party_size`   (pre-rename)
//
// The frontend CSV builder still reads `party_size`, so drift-on rows make it
// throw. This route is the "backend" whose contract drifted 3 weeks ago.

import { NextResponse } from "next/server";
import { RESERVATIONS } from "@/lib/data";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  const { drift } = store.get();

  const rows = RESERVATIONS.map((r) => {
    const base = {
      date: r.date,
      time: r.time,
      guest: r.guest,
      area: r.area,
      status: r.status,
    };
    // Post-rename shape emits `covers`; legacy shape emits `party_size`.
    return drift.enabled
      ? { ...base, covers: r.covers }
      : { ...base, party_size: r.covers };
  });

  return NextResponse.json({
    surface: "export",
    drift: { enabled: drift.enabled, changedAt: drift.changedAt },
    rows,
  });
}
